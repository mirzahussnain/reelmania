import { UserProfile } from "@clerk/clerk-react";


const ManageProfile = () => {
  return (
    <div className="w-full h-full p-2 lg:py-16 flex justify-center lg:items-start items-center">
      <UserProfile
        appearance={{
          elements: {
            cardBox: {
              height: "75vh",
            },
          },
          variables:{
            colorBackground:"var(--color-surface-container)",
            colorText:"var(--color-on-surface)",
            colorPrimary:"var(--color-primary)",
            colorTextSecondary:"var(--color-on-surface-variant)",
            colorNeutral:"var(--color-on-surface)"
          }
        }}
      />
    </div>
  );
};

export default ManageProfile;
