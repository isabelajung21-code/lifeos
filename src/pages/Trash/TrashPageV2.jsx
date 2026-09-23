import TrashPage from "./TrashPage";
import TrashExpirationNotice from "./TrashExpirationNotice";



export default function TrashPageV2({ currentUser }) {
  return (
    <>

      <TrashExpirationNotice />
      <TrashPage currentUser={currentUser} />
    </>
  );
}
