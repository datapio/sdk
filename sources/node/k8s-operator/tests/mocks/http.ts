import sinon from 'sinon'

export const createServer = sinon.stub().returns({
  listen: sinon.stub().returns({
    once: sinon.stub().callsFake(
      (event: any, callback: () => any) => callback()
    )
  })
})

export default { createServer }
