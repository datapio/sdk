import sinon from 'sinon'

const app = <any> (() => 'default backend')
app.use = sinon.stub()
app.get = sinon.stub()

export default () => app
