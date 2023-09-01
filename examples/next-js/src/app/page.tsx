import dynamic from 'next/dynamic'

const NotebookComponentNoSSR = dynamic(
  () => import('../components/NotebookComponent'),
  { ssr: false }
);

function Home() {
  return (
    <>
      <NotebookComponentNoSSR />
    </>
  )
}

export default Home
