import PublicProjectPage from "./[projectSlug]/[pageSlug]/page";

export default function RootPage(props) {
  return PublicProjectPage({
    ...props,
    params: Promise.resolve({
      projectSlug: "d",
      pageSlug: "home",
    }),
  });
}
