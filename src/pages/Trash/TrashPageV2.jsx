import TrashPage from "./TrashPage";
import InboxTrashSection from "./InboxTrashSection";
import HabitsTrashSection from "./HabitsTrashSection";
import InventoryTrashSection from "./InventoryTrashSection";
import GoalsTrashSection from "./GoalsTrashSection";
import ListsTrashSection from "./ListsTrashSection";
import DocumentsTrashSection from "./DocumentsTrashSection";
import JournalTrashSection from "./JournalTrashSection";
import StudiesTrashSection from "./StudiesTrashSection";
import ContentTrashSection from "./ContentTrashSection";
import EntertainmentTrashSection from "./EntertainmentTrashSection";
import TrashExpirationNotice from "./TrashExpirationNotice";



export default function TrashPageV2({ currentUser }) {
  return (
    <>

      <TrashExpirationNotice />
      <TrashPage currentUser={currentUser} />
      <InboxTrashSection currentUser={currentUser} />
      <HabitsTrashSection currentUser={currentUser} />
      <InventoryTrashSection />
      <GoalsTrashSection currentUser={currentUser} />
      <ListsTrashSection currentUser={currentUser} />
      <DocumentsTrashSection currentUser={currentUser} />
      <JournalTrashSection currentUser={currentUser} />
      <StudiesTrashSection currentUser={currentUser} />
      <ContentTrashSection currentUser={currentUser} />
      <EntertainmentTrashSection currentUser={currentUser} />
    </>
  );
}