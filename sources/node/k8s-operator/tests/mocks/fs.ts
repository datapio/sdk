import sinon from 'sinon'

export const readFileSync = sinon.stub().returns('DATA')

export default { readFileSync }
