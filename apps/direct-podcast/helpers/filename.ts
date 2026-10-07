const addZero = (str: string) => (str.length === 1 ? `0${str}` : str)

const filename = () => {
  const now = new Date()
  const d = addZero(now.getDate().toString())
  const m = addZero((now.getMonth() + 1).toString())
  const y = now.getFullYear()
  const h = addZero(now.getHours().toString())
  const min = addZero(now.getMinutes().toString())
  const s = addZero(now.getSeconds().toString())

  return `${d}.${m}.${y}-${h}.${min}.${s}`
}

export default filename
