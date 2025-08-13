import Cpf from './cpf';

describe('Cpf', () => {
  it('Deve validar como verdadeiro um cpf válido', () => {
    const validCpf = '033.777.492-76';
    expect(new Cpf(validCpf)).toBeTruthy();
  });

  it('Deve validar como verdadeiro um cpf válido que termine em 0', () => {
    const validCpf = '99048058490';
    expect(new Cpf(validCpf)).toBeTruthy();
  });

  it('Deve validar como verdadeiro um cpf válido que o primeiro dígito é 0', () => {
    const validCpf = '91609085809';
    expect(new Cpf(validCpf)).toBeTruthy();
  });

  it('Deve validar como falso um cpf inválido', () => {
    const invalidCpf = '456.543.789-00';
    expect(() => new Cpf(invalidCpf)).toThrow(Cpf.errorCodes.INVALID_CPF);
  });

  it('Deve validar como falso um cpf com menos de 11 caracteres', () => {
    const invalidCpf = '00000000';
    expect(() => new Cpf(invalidCpf)).toThrow(Cpf.errorCodes.INVALID_CPF);
  });

  it('Deve validar como falso um cpf com mais de 14 caracteres', () => {
    const invalidCpf = '000.000.000-000000000';
    expect(() => new Cpf(invalidCpf)).toThrow(Cpf.errorCodes.INVALID_CPF);
  });

  it('Deve validar como falso um cpf com caracteres iguais', () => {
    const invalidCpf = '111.111.111-11';
    expect(() => new Cpf(invalidCpf)).toThrow(Cpf.errorCodes.INVALID_CPF);
  });

  it('Deve validar como falso um cpf com 0 characteres', () => {
    expect(() => new Cpf('')).toThrow(Cpf.errorCodes.INVALID_CPF);
  });

  it('Deve validar como falso um cpf com characteres alfabéticos', () => {
    expect(() => new Cpf('abcdefghijkl')).toThrow(Cpf.errorCodes.INVALID_CPF);
  });

  it('Deve retornar o valor do cpf sem formatação', () => {
    const validCpf = '033.777.492-76';
    const cpf = new Cpf(validCpf);
    expect(cpf.value).toBe('03377749276');
  });
});
