function Frame() {
  return <div className="absolute bg-[#27262b] left-[0.46px] rounded-[4px] size-[24px] top-[-0.17px]" />;
}

function Text() {
  return (
    <div className="h-[24.003px] relative shrink-0 w-[24.163px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid h-[24.003px] relative w-[24.163px]">
        <Frame />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex h-[25.06px] items-start justify-between left-0 top-0 w-[203.729px]" data-name="Container">
      {[...Array(2).keys()].map((_, i) => (
        <Text key={i} />
      ))}
    </div>
  );
}

function Heading() {
  return <div className="absolute h-[24.003px] left-0 top-[31.06px] w-[203.729px]" data-name="Heading 3" />;
}

function Frame3() {
  return <div className="absolute bg-[#27262b] h-[24px] left-0 rounded-[4px] top-[-30px] w-[127px]" />;
}

function Frame4() {
  return (
    <div className="absolute bg-[#27262b] h-[45px] left-[0.46px] rounded-[4px] top-[60.83px] w-[204px]">
      <Frame3 />
    </div>
  );
}

function Frame1() {
  return <div className="absolute bg-[#27262b] h-[15.999px] left-0 rounded-[4px] top-[115.06px] w-[203.729px]" />;
}

function Container1() {
  return (
    <div className="h-[131.057px] relative shrink-0 w-[203.729px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid h-[131.057px] relative w-[203.729px]">
        <Container />
        <Heading />
        <Frame4 />
        <Frame1 />
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[#27262b] h-[35.992px] relative rounded-[4px] shrink-0 w-[203.729px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid h-[35.992px] w-[203.729px]" />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[11.997px] h-[211.045px] items-start left-0 pb-0 pl-[15.999px] pr-0 pt-[15.999px] top-0 w-[235.728px]" data-name="Container">
      <Container1 />
      <Frame2 />
    </div>
  );
}

export default function SoundCardDestkopTablet() {
  return (
    <div className="bg-[#1f1f20] border-[0.537px] border-solid border-zinc-800 overflow-clip relative rounded-[14px] size-full" data-name="SoundCard Destkop Tablet">
      <Container2 />
    </div>
  );
}