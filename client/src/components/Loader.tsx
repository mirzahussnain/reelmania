import { MutatingDots } from "react-loader-spinner";

type Props = {};

const Loader = (props: Props) => {
  return (
    <div className=" w-full h-full flex items-center justify-center top-0 right-0 z-[100] absolute">
      <MutatingDots
        visible={true}
        height="100"
        width="100"
        color="#F5F5DC"
        secondaryColor="#D8BFD8"
        radius="12.5"
        ariaLabel="mutating-dots-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    </div>
  );
};

export default Loader;
