export function mkSetProtector<A>(
  setter: (x: A) => void,
): (x: A) => void {
  let isSetting = false;
  let value: A | undefined = undefined;
  return (x: A) => {
    value = x;
    if (isSetting) {
      return;
    }
    isSetting = true;
    setTimeout(() => {
      isSetting = false;
      setter(value!);
      value = undefined;
    });
  };
}
