// src/infraestructure/services/cpf-generator.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class CpfGenerator {
  /**
   * Gera um número de CPF formatado e válido.
   * @returns {string} CPF no formato XXX.XXX.XXX-XX
   */
  public gerarCpf(): string {
    const num1 = this.aleatorio();
    const num2 = this.aleatorio();
    const num3 = this.aleatorio();

    const dig1 = this.dig(num1, num2, num3);
    const dig2 = this.dig(num1, num2, num3, dig1);

    return `${num1}.${num2}.${num3}-${dig1}${dig2}`;
  }

  /**
   * Gera um bloco de 3 números aleatórios como string.
   * @private
   * @returns {string}
   */
  private aleatorio(): string {
    const aleat = Math.floor(Math.random() * 999);
    return aleat.toString().padStart(3, '0');
  }

  /**
   * Calcula um dígito verificador do CPF.
   * @private
   * @param {string} n1 - Primeiro bloco de 3 números.
   * @param {string} n2 - Segundo bloco de 3 números.
   * @param {string} n3 - Terceiro bloco de 3 números.
   * @param {number} [n4] - Primeiro dígito verificador (usado para calcular o segundo).
   * @returns {number} - O dígito verificador calculado.
   */
  private dig(n1: string, n2: string, n3: string, n4?: number): number {
    const nums = n1.split('').concat(n2.split(''), n3.split(''));

    if (n4 !== undefined) {
      nums[9] = n4.toString();
    }

    let x = 0;
    for (let i = n4 !== undefined ? 11 : 10, j = 0; i >= 2; i--, j++) {
      x += parseInt(nums[j]) * i;
    }

    const y = x % 11;
    return y < 2 ? 0 : 11 - y;
  }
}
