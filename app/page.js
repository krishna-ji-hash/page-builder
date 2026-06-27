import PublicProjectPage from "./[projectSlug]/[pageSlug]/page";

export default function RootPage(props) {
  return PublicProjectPage({
    ...props,
    searchParams: props.searchParams ?? Promise.resolve({}),
    params: Promise.resolve({
      projectSlug: "d",
      pageSlug: "home",
    }),
  });
}
