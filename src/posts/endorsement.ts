import db = require('../database')
import plugins = require('../plugins')

interface PostData {
  pid: number
  endorsed: string
}

interface ToggleEndorsementResult {
  post: PostData
  isEndorsed: boolean
}

interface PostsModel {
  endorse: (pid: number) => Promise<ToggleEndorsementResult>
  unendorse: (pid: number) => Promise<ToggleEndorsementResult>
  hasEndorsed: (pid: number) => Promise<boolean>
  getPostFields: (pid: number, fields: string[]) => Promise<PostData>
  setPostField: (pid: number, field: string, value: string) => Promise<void>
}

module.exports = function (Posts: PostsModel) {
  Posts.hasEndorsed = async function (pid: number): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return ((await db.getObjectField(`post:${pid}`, 'endorsed')) === 'true')
  }

  async function toggleEndorsement(type: 'endorse' | 'unendorse', pid: number): Promise<ToggleEndorsementResult> {
    const isEndorsing = type === 'endorse'

    const [postData, hasEndorsed] = await Promise.all([
      Posts.getPostFields(pid, ['pid', 'endorsed']),
      Posts.hasEndorsed(pid)
    ])

    if (isEndorsing && hasEndorsed) {
      throw new Error('[[error:already-endorsed]]')
    }

    if (!isEndorsing && !hasEndorsed) {
      throw new Error('[[error:already-unendorsed]]')
    }

    postData.endorsed = (postData.endorsed === 'true') ? 'false' : 'true'
    await Posts.setPostField(pid, 'endorsed', postData.endorsed)

    plugins.hooks.fire(`action:post.${type}`, {
      pid,
      current: hasEndorsed ? 'endorsed' : 'unendorsed'
    })
      .catch((err: unknown) => {
        console.error('Error setting post field:', err)
        throw new Error('[[error:unknown]]')
      })

    return {
      post: postData,
      isEndorsed: isEndorsing
    }
  }

  Posts.endorse = async function (pid: number): Promise<ToggleEndorsementResult> {
    return await toggleEndorsement('endorse', pid)
  }

  Posts.unendorse = async function (pid: number): Promise<ToggleEndorsementResult> {
    return await toggleEndorsement('unendorse', pid)
  }
}
