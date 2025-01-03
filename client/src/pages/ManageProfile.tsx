import { UserProfile } from "@clerk/clerk-react";

type Props = {};

const ManageProfile = (props: Props) => {
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
            colorBackground:"#343434",
            "colorText":"white",
            "colorPrimary":"#F9F6EE",
            "colorTextSecondary":"#F9F6EE",
            "colorNeutral":"#F9F6EE"
          }
        }}
      />
    </div>
  );
};

export default ManageProfile;
