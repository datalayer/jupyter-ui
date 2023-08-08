// This allows the text of .svg files to be directly imported
declare module '*.svg' {
  const value: string;
  export default value;
}
