const amqp = require('amqplib');

async function testRabbitMQConnection() {
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
  
  console.log('🐰 Testando conexão RabbitMQ...');
  console.log('URL:', RABBITMQ_URL.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
  
  try {
    console.log('📡 Conectando...');
    const connection = await amqp.connect(RABBITMQ_URL, {
      heartbeat: 60,
    });
    
    console.log('✅ Conexão estabelecida!');
    
    console.log('📺 Criando canal...');
    const channel = await connection.createChannel();
    
    console.log('✅ Canal criado!');
    
    console.log('📋 Declarando queue ClubRequest...');
    await channel.assertQueue('ClubRequest', { durable: true });
    
    console.log('✅ Queue declarada!');
    
    console.log('📤 Enviando mensagem de teste...');
    await channel.sendToQueue('ClubRequest', Buffer.from(JSON.stringify({
      pattern: 'test',
      data: { message: 'Hello RabbitMQ!' },
      id: 'test-' + Date.now()
    })));
    
    console.log('✅ Mensagem enviada!');
    
    console.log('🔌 Fechando conexão...');
    await channel.close();
    await connection.close();
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRabbitMQConnection();