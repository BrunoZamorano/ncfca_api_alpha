import { Controller, Get, Res } from '@nestjs/common';
import { register, Gauge } from 'prom-client';
import { Response } from 'express';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

// A métrica é definida globalmente uma única vez.
const dlqGauge = new Gauge({
  name: 'rabbitmq_dlq_messages_ready',
  help: 'Number of messages ready in the Dead Letter Queue',
  labelNames: ['queue_name'],
});

@Controller('metrics')
export class MetricsController {
  constructor(private readonly configService: ConfigService) { }

  @Get()
  async getMetrics(@Res() res: Response) {
    // A cada requisição, o valor da métrica é atualizado.
    await this.updateDlqMetric();

    // O endpoint expõe o registro completo de métricas.
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }

  private async updateDlqMetric() {
    const queueName = 'ClubRequest-dlq'; // A fila específica que estamos monitorando
    try {
      const rabbitmqApiUrl = this.configService.get<string>('RABBITMQ_API_URL', 'http://localhost:15672');
      const rabbitmqUser = this.configService.get<string>('RABBITMQ_USER', 'guest');
      const rabbitmqPass = this.configService.get<string>('RABBITMQ_PASS', 'guest');
      const vhost = this.configService.get<string>('RABBITMQ_VHOST', '/');

      const encodedVhost = encodeURIComponent(vhost);
      const url = `${rabbitmqApiUrl}/api/queues/${encodedVhost}/${queueName}`;

      const response = await axios.get(url, {
        auth: { username: rabbitmqUser, password: rabbitmqPass },
        timeout: 2000, // Timeout curto para não prender a requisição de métricas.
      });

      const messageCount = response.data.messages_ready;
      dlqGauge.labels(queueName).set(messageCount);
    } catch (error) {
      console.error(`[Metrics] Falha ao buscar métricas da DLQ '${queueName}': ${error.message}`);
      // Em caso de falha na consulta, é crucial expor um valor que indique o erro.
      dlqGauge.labels(queueName).set(-1);
    }
  }
}
