import { AgentMessage, Incident } from '../types/index.js';

export interface SwitchPlatformConfig {
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  switchConsoleGatewayUrl?: string;
  enableLiveExternalWebhooks: boolean;
}

export class SwitchBridge {
  private config: SwitchPlatformConfig = {
    enableLiveExternalWebhooks: false,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    switchConsoleGatewayUrl: process.env.SWITCH_CONSOLE_URL || 'http://localhost:5000'
  };

  private broadcastCallback?: (event: string, data: any) => void;

  public setBroadcastCallback(cb: (event: string, data: any) => void) {
    this.broadcastCallback = cb;
  }

  public updateConfig(newConfig: Partial<SwitchPlatformConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): SwitchPlatformConfig {
    return { ...this.config };
  }

  /**
   * Broadcast an agent message out to team channels (Slack / Discord / Switch Console)
   */
  public async dispatchToChannels(incident: Incident, message: AgentMessage): Promise<void> {
    // 1. Notify connected Web War Room UI via WebSocket
    if (this.broadcastCallback) {
      this.broadcastCallback('message_created', { incidentId: incident.id, message });
    }

    // 2. Format payload for Slack if configured
    if (this.config.enableLiveExternalWebhooks && this.config.slackWebhookUrl) {
      await this.sendToSlack(this.config.slackWebhookUrl, incident, message);
    }

    // 3. Format payload for Discord if configured
    if (this.config.enableLiveExternalWebhooks && this.config.discordWebhookUrl) {
      await this.sendToDiscord(this.config.discordWebhookUrl, incident, message);
    }
  }

  /**
   * Format message in Slack Block Kit format
   */
  private async sendToSlack(webhookUrl: string, incident: Incident, msg: AgentMessage) {
    try {
      const blocks: any[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${msg.agentName}* [${msg.sender.toUpperCase()}] in \`#war-room-${incident.service}\`:\n${msg.text}`
          }
        }
      ];

      if (msg.codeSnippet) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*\`${msg.codeSnippet.filename}\`*\n\`\`\`${msg.codeSnippet.language}\n${msg.codeSnippet.code.slice(0, 600)}\n\`\`\``
          }
        });
      }

      if (msg.actionRequired && msg.actions) {
        blocks.push({
          type: 'actions',
          elements: msg.actions.map(act => ({
            type: 'button',
            text: { type: 'plain_text', text: act.label },
            value: act.action,
            style: act.style === 'primary' ? 'primary' : act.style === 'danger' ? 'danger' : undefined
          }))
        });
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks })
      });
    } catch (err) {
      console.warn('[SwitchBridge] Slack dispatch skipped or failed:', err);
    }
  }

  /**
   * Format message for Discord Webhook
   */
  private async sendToDiscord(webhookUrl: string, incident: Incident, msg: AgentMessage) {
    try {
      const embed: any = {
        title: `${msg.agentName} (${msg.sender})`,
        description: msg.text,
        color: msg.sender === 'guardrail' ? 0xe11d48 : msg.sender === 'patch' ? 0x059669 : 0x4f46e5,
        fields: [
          { name: 'Incident', value: `${incident.title} (${incident.severity})`, inline: true },
          { name: 'Status', value: incident.status, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      if (msg.codeSnippet) {
        embed.fields.push({
          name: msg.codeSnippet.filename,
          value: `\`\`\`${msg.codeSnippet.language}\n${msg.codeSnippet.code.slice(0, 500)}\n\`\`\``
        });
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `Switch - ${msg.agentName}`,
          embeds: [embed]
        })
      });
    } catch (err) {
      console.warn('[SwitchBridge] Discord dispatch skipped or failed:', err);
    }
  }
}

export const switchBridge = new SwitchBridge();

