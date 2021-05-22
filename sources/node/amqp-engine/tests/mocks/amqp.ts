import * as sinon from 'sinon'

export const conn = <any> sinon.spy()
export const channel = <any> sinon.spy()

conn.createChannel = sinon.stub().resolves(channel)
conn.close = sinon.stub().resolves()

channel.assertExchange = sinon.stub().resolves()
channel.assertQueue = sinon.stub().resolves()
channel.bindQueue = sinon.stub().resolves()
channel.ack = sinon.stub().resolves()
channel.nack = sinon.stub().resolves()
channel.sendToQueue = sinon.stub().resolves()
channel.publish = sinon.stub().resolves()
channel.consume = sinon.stub().resolves({ consumerTag: 'tag' })
channel.cancel = sinon.stub().resolves()
channel.close = sinon.stub().resolves()

export default {
  connect: sinon.stub().resolves(conn)
}
