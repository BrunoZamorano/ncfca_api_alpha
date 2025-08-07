// Adicione esta função no topo do seu arquivo de teste
/**
 * Verifica repetidamente uma condição até que ela seja satisfeita ou um timeout seja atingido.
 * @param assertion - A função que contém a lógica de verificação (ex: busca no banco e expects). Deve lançar um erro em caso de falha.
 * @param timeout - Tempo máximo de espera em milissegundos.
 * @param interval - Intervalo entre as tentativas em milissegundos.
 */
export function pollForCondition(assertion: () => Promise<void>, timeout = 5000, interval = 300): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const tryAssertion = async () => {
      try {
        await assertion();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Polling timed out after ${timeout}ms. Last error: ${error.message}`));
        } else {
          setTimeout(tryAssertion, interval);
        }
      }
    };
    tryAssertion();
  });
}
