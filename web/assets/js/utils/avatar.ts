export function avatarize(id: string) {
  function sumChars(s: string) {
    var i,
      n = s.length,
      acc = 0;
    for (i = 0; i < n; i++) {
      acc += parseInt(s[i], 36) - 9;
    }

    let singlesum = 0;
    while (acc >= 10) {
      singlesum = 0;
      while (acc > 0) {
        let rem;
        rem = acc % 10;
        singlesum = singlesum + rem;
        acc = acc / 10;
      }
      acc = singlesum;
    }

    const norm = (acc - 0) / (10 - 0);
    return norm;
  }
  return sumChars(id);
}
