import through from 'through'

const context = {
  world: <any> null
}

export const setUp = () => {
  context.world = {
    stream: through(),
    watcher: {
      added: false,
      modified: false,
      deleted: false
    }
  }
}

export const withWorld = (cb: (world: any) => any) => cb(context.world)
