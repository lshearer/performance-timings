// Make updated build resources available to cloned repos
export default function() {
  process.env.BUILD_RESOURCES = __dirname;
}
