if (!process.getuid || !process.getgid) {
  throw new Error("Tests require getuid/getgid support")
}

const curUid = +process.getuid()
const curGid = +process.getgid()
const chownr = require("../")
const t = require("tap")
const mkdirp = require("mkdirp")
const rimraf = require("rimraf")
const fs = require("fs")

// sniff the 'id' command for other groups that i can legally assign to
const {exec} = require("child_process")
let groups
let dirs = []

t.test('get the ids to use', { bail: true }, t => {
  exec("id", function (code, output) {
    if (code) throw new Error("failed to run 'id' command")
    groups = output.trim().split("=")[3].split(",")
      .map(s => parseInt(s, 10))
      .filter(g => g !== curGid)
    t.end()
  })
})

t.test('run test', t => {
  const dir = t.testdir({
    a: { b: { c: {}}},
    d: { e: { f: {}}},
    g: { h: { i: {}}},
    j: { k: { l: {}}},
    m: { n: { o: {}}},
  })

  t.test("should complete successfully", t => {
    // console.error("calling chownr", curUid, groups[0], typeof curUid, typeof groups[0])
    chownr(dir, curUid, groups[0], er => {
      if (er)
        throw er
      t.end()
    })
  })

  const dirs = [
    '',
    'a',
    'a/b',
    'a/b/c',
    'd',
    'd/e',
    'd/e/f',
    'g',
    'g/h',
    'g/h/i',
    'j',
    'j/k',
    'j/k/l',
    'm',
    'm/n',
    'm/n/o',
  ]

  dirs.forEach(d => t.test(`verify ${d}`, t => {
    t.match(fs.statSync(`${dir}/${d}`), {
      uid: curUid,
      gid: groups[0],
    })
    t.end()
  }))
  t.end()
})
