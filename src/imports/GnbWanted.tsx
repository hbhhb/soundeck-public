import svgPaths from "./svg-nf9qs3okyi";
import imgImage1 from "figma:asset/bd02ed388eb0fa7e62b36a102c90f5dc4f6096ce.png";
import { imgImage } from "./svg-wmi89";

function Symbol() {
  return (
    <div className="absolute contents inset-[12.96%_0.93%_6.57%_0.93%]" data-name="Symbol">
      <div className="absolute inset-[12.5%_0.31%_6.02%_0.31%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0.189px_0.118px] mask-size-[30.033px_20.518px]" data-name="Image" style={{ maskImage: `url('${imgImage}')` }}>
        <img alt="" className="block max-w-none size-full" height="20.778" src={imgImage1} width="30.411" />
      </div>
    </div>
  );
}

function LogoResourceAssetSymbolWanted() {
  return (
    <div className="absolute bottom-0 left-0 right-[72.38%] top-0" data-name="Logo/Resource/Asset/Symbol/Wanted">
      <Symbol />
    </div>
  );
}

function LogoResourceAssetLogotypeWanted() {
  return (
    <div className="absolute bottom-0 left-[30.14%] right-0 top-0" data-name="Logo/Resource/Asset/Logotype/Wanted">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 78 26">
        <g id="Logo/Resource/Asset/Logotype/Wanted">
          <path d={svgPaths.p401900} fill="var(--fill-0, black)" id="Shape" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-0" data-name="Group">
      <LogoResourceAssetSymbolWanted />
      <LogoResourceAssetLogotypeWanted />
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute inset-[10.16%_0.19%_10.16%_0.89%]" data-name="Logo">
      <Group />
    </div>
  );
}

function Ratio() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio1() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[22.627px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[315deg]">
          <Ratio />
        </div>
      </div>
    </div>
  );
}

function Ratio2() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[38.627px]" style={{ "--transform-inner-width": "22.625", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[315deg]">
          <Ratio1 />
        </div>
      </div>
    </div>
  );
}

function Ratio3() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[50.16px]" style={{ "--transform-inner-width": "38.625", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[320deg]">
          <Ratio2 />
        </div>
      </div>
    </div>
  );
}

function Ratio4() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[59.496px]" style={{ "--transform-inner-width": "50.15625", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[327deg]">
          <Ratio3 />
        </div>
      </div>
    </div>
  );
}

function Ratio5() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[67.555px]" style={{ "--transform-inner-width": "59.484375", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[332deg]">
          <Ratio4 />
        </div>
      </div>
    </div>
  );
}

function Ratio6() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[74.749px]" style={{ "--transform-inner-width": "67.546875", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[335deg]">
          <Ratio5 />
        </div>
      </div>
    </div>
  );
}

function Ratio7() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[81.31px]" style={{ "--transform-inner-width": "74.734375", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[337deg]">
          <Ratio6 />
        </div>
      </div>
    </div>
  );
}

function Ratio8() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[87.378px]" style={{ "--transform-inner-width": "81.296875", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[339deg]">
          <Ratio7 />
        </div>
      </div>
    </div>
  );
}

function Ratio9() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[93.053px]" style={{ "--transform-inner-width": "87.375", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[340deg]">
          <Ratio8 />
        </div>
      </div>
    </div>
  );
}

function Ratio10() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[98.401px]" style={{ "--transform-inner-width": "93.046875", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[341deg]">
          <Ratio9 />
        </div>
      </div>
    </div>
  );
}

function Ratio11() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[103.474px]" style={{ "--transform-inner-width": "98.390625", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[342deg]">
          <Ratio10 />
        </div>
      </div>
    </div>
  );
}

function Ratio12() {
  return (
    <div className="content-stretch flex h-full items-center justify-center overflow-clip relative" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[108.308px]" style={{ "--transform-inner-width": "103.46875", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[343deg]">
          <Ratio11 />
        </div>
      </div>
    </div>
  );
}

function Ratio13() {
  return (
    <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px overflow-clip relative shrink-0" data-name="Ratio">
      <div className="flex h-full items-center justify-center relative shrink-0 w-[112px]" style={{ "--transform-inner-width": "108.296875", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[350.924deg]">
          <Ratio12 />
        </div>
      </div>
    </div>
  );
}

function LogoWantedLogoHorizontal() {
  return (
    <div className="content-stretch flex flex-col h-[32px] items-center relative shrink-0" data-name="Logo/Wanted/Logo Horizontal">
      <Logo />
      <Ratio13 />
    </div>
  );
}

function Logo1() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-center min-h-px min-w-px relative shrink-0" data-name="Logo">
      <LogoWantedLogoHorizontal />
    </div>
  );
}

function Leading() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-[112px]" data-name="Leading">
      <Logo1 />
    </div>
  );
}

function Ratio14() {
  return (
    <div className="h-full relative w-[16.971px]" data-name="Ratio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 24">
        <g id="Ratio">
          <g id="Ratio_2"></g>
        </g>
      </svg>
    </div>
  );
}

function Ratio15() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px overflow-clip relative shrink-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "16.96875", "--transform-inner-height": "1" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[340.529deg]">
          <Ratio14 />
        </div>
      </div>
    </div>
  );
}

function IconNormalSearch() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Icon/Normal/Search">
      <Ratio15 />
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Shape">
          <path clipRule="evenodd" d={svgPaths.pfd58780} fill="var(--fill-0, #171719)" fillRule="evenodd" id="Normal" />
        </g>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Icon">
      <IconNormalSearch />
    </div>
  );
}

function Interaction() {
  return <div className="absolute bg-[#171719] inset-0 opacity-0 rounded-[1000px]" data-name="Interaction" />;
}

function Interaction1() {
  return (
    <div className="absolute inset-[-8px]" data-name="Interaction">
      <Interaction />
    </div>
  );
}

function Icon1() {
  return (
    <div className="content-stretch flex flex-col h-[24px] items-center justify-center relative shrink-0" data-name="Icon 1">
      <Icon />
      <Interaction1 />
    </div>
  );
}

function Ratio16() {
  return (
    <div className="h-full relative w-[16.971px]" data-name="Ratio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 24">
        <g id="Ratio">
          <g id="Ratio_2"></g>
        </g>
      </svg>
    </div>
  );
}

function Ratio17() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px overflow-clip relative shrink-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "16.96875", "--transform-inner-height": "1" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[340.529deg]">
          <Ratio16 />
        </div>
      </div>
    </div>
  );
}

function IconVariant() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="┗ Icon Variant ᠎">
      <Ratio17 />
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Shape">
          <g id="Normal">
            <path clipRule="evenodd" d={svgPaths.pd6a8a40} fill="#171719" fillRule="evenodd" />
            <path d={svgPaths.p1f66380} fill="#171719" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Icon4() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Icon">
      <IconVariant />
    </div>
  );
}

function Interaction2() {
  return <div className="absolute bg-[#171719] inset-0 opacity-0 rounded-[1000px]" data-name="Interaction" />;
}

function Interaction3() {
  return (
    <div className="absolute inset-[-8px]" data-name="Interaction">
      <Interaction2 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="content-stretch flex flex-col h-[24px] items-center justify-center relative shrink-0" data-name="Icon 2">
      <Icon4 />
      <Interaction3 />
    </div>
  );
}

function Ratio18() {
  return (
    <div className="h-full relative w-[16.971px]" data-name="Ratio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 24">
        <g id="Ratio">
          <g id="Ratio_2"></g>
        </g>
      </svg>
    </div>
  );
}

function Ratio19() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px overflow-clip relative shrink-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "16.96875", "--transform-inner-height": "1" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[340.529deg]">
          <Ratio18 />
        </div>
      </div>
    </div>
  );
}

function IconNormalMenu() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Icon/Normal/Menu">
      <Ratio19 />
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Shape">
          <g id="Normal">
            <path d={svgPaths.pdb43300} fill="#171719" />
            <path d={svgPaths.p30cbe400} fill="#171719" />
            <path d={svgPaths.p12d01000} fill="#171719" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Icon5() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Icon">
      <IconNormalMenu />
    </div>
  );
}

function Interaction4() {
  return <div className="absolute bg-[#171719] inset-0 opacity-0 rounded-[1000px]" data-name="Interaction" />;
}

function Interaction5() {
  return (
    <div className="absolute inset-[-8px]" data-name="Interaction">
      <Interaction4 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="content-stretch flex flex-col h-[24px] items-center justify-center relative shrink-0" data-name="Icon 3">
      <Icon5 />
      <Interaction5 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="content-stretch flex gap-[16px] items-center justify-end px-0 py-[2px] relative shrink-0" data-name="Icon">
      <Icon1 />
      <Icon2 />
      <Icon3 />
    </div>
  );
}

function Action() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Action">
      <Icon6 />
    </div>
  );
}

function Trailing() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Trailing">
      <Action />
    </div>
  );
}

function Content() {
  return (
    <div className="max-w-[1100px] relative shrink-0 w-full" data-name="Content">
      <div className="flex flex-row items-center max-w-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between max-w-[inherit] pl-[20px] pr-[16px] py-[12px] relative w-full">
          <Leading />
          <Trailing />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-name="Container">
      <Content />
    </div>
  );
}

export default function GnbWanted() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center relative size-full" data-name="GNB/Wanted">
      <Container />
    </div>
  );
}