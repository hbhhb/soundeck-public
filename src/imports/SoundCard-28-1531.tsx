import svgPaths from "./svg-y3ng5clnnu";
import imgWaveform from "figma:asset/744210740a8eb3de5c9dbb96e58cddaca8488121.png";

function Container() {
  return (
    <div className="bg-zinc-800 relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[40px]">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[32px] not-italic relative shrink-0 text-[24px] text-neutral-50 text-nowrap tracking-[0.0703px] whitespace-pre">📢</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-zinc-800 relative rounded-[4px] shrink-0 w-[24px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#323237] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[9px] py-[4px] relative w-[24px]">
        <p className="font-['Inter:Bold',sans-serif] font-bold leading-[16px] not-italic relative shrink-0 text-[12px] text-center text-zinc-400 w-full">1</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container />
      <Container1 />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0 w-full" data-name="Heading 3">
      <p className="[white-space-collapse:collapse] basis-0 font-['Inter:Semi_Bold',sans-serif] font-semibold grow leading-[24px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-neutral-50 text-nowrap tracking-[-0.3125px]">Air Horn</p>
    </div>
  );
}

function Waveform() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Waveform">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgWaveform} />
    </div>
  );
}

function Text() {
  return <div className="absolute h-[14px] left-[36.13px] opacity-50 top-px w-[7.227px]" data-name="Text" />;
}

function Frame() {
  return (
    <div className="absolute content-stretch flex font-['Pretendard:Medium',sans-serif] gap-[2px] items-center leading-[16px] left-0 not-italic text-[12px] text-nowrap top-px whitespace-pre">
      <p className="relative shrink-0 text-zinc-400">0:00</p>
      <p className="relative shrink-0 text-zinc-600">/</p>
      <p className="relative shrink-0 text-zinc-400">0:02</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[16px] relative shrink-0 w-full" data-name="Container">
      <Text />
      <Frame />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <Container2 />
      <Heading />
      <Waveform />
      <Container3 />
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p36f329f0} fill="var(--fill-0, #FAFAFA)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Icon />
    </div>
  );
}

function Button() {
  return (
    <div className="basis-0 bg-zinc-800 grow h-[36px] min-h-px min-w-px relative rounded-[12px] shrink-0" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[4px] h-[36px] items-center justify-center px-[16px] py-[8px] relative w-full">
          <Frame2 />
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-neutral-50 text-nowrap tracking-[-0.1504px] whitespace-pre">Play</p>
        </div>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p36e45a00} id="Vector" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p150f5b00} id="Vector_2" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p2d6e5280} id="Vector_3" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[36px]" data-name="Button">
      <Icon1 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[4px] items-start relative shrink-0 w-full">
      <Button />
      <Button1 />
    </div>
  );
}

export default function SoundCard() {
  return (
    <div className="bg-[#1f1f23] relative rounded-[14px] size-full" data-name="SoundCard">
      <div aria-hidden="true" className="absolute border border-solid border-zinc-800 inset-0 pointer-events-none rounded-[14px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[16px] relative size-full">
          <Frame1 />
          <Frame3 />
        </div>
      </div>
    </div>
  );
}