export default function indent(text: string, indent: string = '  ') {
  const joinString = '\n' + indent;
  return indent + text.split('\n').join(joinString);
}
