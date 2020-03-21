/*
 * code inspired from stackoverflow answer by trincot
 * reference: https://stackoverflow.com/questions/54733539/javascript-implementation-of-lodash-set-method
 */

const isNotObject = o => Object(o) !== o

const isArrayIndexable = s => Math.abs(s) >> 0 === +s

const objectify = nextPathPart => isArrayIndexable(nextPathPart) ? [] : {}

const reduceObjectBranch = (max, value, aPath) => (branch, pathPart, i) => {
  if (i === max) {
    branch[pathPart] = value
  } else if (isNotObject(branch[pathPart])) {
    branch[pathPart] = objectify(aPath[i + 1])
  }
  return branch[pathPart]
}

const toString = o => o == null ? '' : o.toString()

const set = (obj, path, value) => {
  if (isNotObject(obj)) return obj
  const aPath = toString(path).match(/[^.[\]]+/g) || []
  const max = aPath.length - 1
  aPath.reduce(reduceObjectBranch(max, value, aPath), obj)
  return obj
}

export default set
