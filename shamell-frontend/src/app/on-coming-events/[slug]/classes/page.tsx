import UpcomingClassesPublicPage from "../../components/UpcomingClassesPublicPage";

type Props = { params: Promise<{ slug: string }> };

export default async function UpcomingClassesRoutePage({ params }: Props) {
  const { slug } = await params;
  return <UpcomingClassesPublicPage slug={slug} />;
}
