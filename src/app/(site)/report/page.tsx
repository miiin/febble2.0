import ReportForm from '@/components/report/ReportForm';
import SectionTitle from '@/components/ui/SectionTitle';

export default function ReportPage() {
  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="Report" sub="공연 제보하기" />
      <p className="mt-3 text-sm leading-relaxed tracking-[-0.04em]">
        febble에 없는 공연이나 페스티벌, 틀린 정보를 알려주세요.
        <br />
        공연 이름만 알아도 괜찮아요.
      </p>
      <ReportForm />
    </main>
  );
}
