import type { BreathingTechnique } from './types';

export const techniques: BreathingTechnique[] = [
  {
    id: 'box',
    name: 'Thở Hộp (Box Breathing)',
    description:
      'Kỹ thuật thở 4-4-4-4, được đặc nhiệm Navy SEAL Mỹ sử dụng để giữ bình tĩnh và tập trung dưới áp lực.',
    benefit: 'Tập trung & Bình tĩnh',
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    color: 'bg-blue-500',
  },
  {
    id: '478',
    name: 'Thở 4-7-8',
    description:
      'Kỹ thuật của bác sĩ Andrew Weil, hoạt động như một loại thuốc an thần tự nhiên cho hệ thần kinh.',
    benefit: 'Giúp ngủ ngon',
    pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
    color: 'bg-indigo-500',
  },
  {
    id: 'diaphragmatic',
    name: 'Thở Bụng (Cơ hoành)',
    description:
      'Thở sâu bằng cơ hoành giúp giảm căng thẳng và làm chậm nhịp tim ngay lập tức.',
    benefit: 'Thư giãn sâu',
    pattern: { inhale: 4, hold1: 0, exhale: 6, hold2: 0 },
    color: 'bg-emerald-500',
  },
  {
    id: 'resonant',
    name: 'Thở Cộng Hưởng',
    description:
      'Thở chậm 5-5 giây, tạo nhịp cộng hưởng giữa tim và phổi. Nghiên cứu chứng minh giúp giảm lo âu hiệu quả.',
    benefit: 'Giảm lo âu',
    pattern: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 },
    color: 'bg-rose-500',
  },
  {
    id: 'energizing',
    name: 'Thở Năng Lượng',
    description:
      'Nhịp thở ngắn và mạnh giúp kích thích hệ thần kinh giao cảm, tăng sự tỉnh táo và tràn đầy năng lượng.',
    benefit: 'Tăng năng lượng',
    pattern: { inhale: 2, hold1: 0, exhale: 2, hold2: 0 },
    color: 'bg-orange-500',
  },
  {
    id: 'calm',
    name: 'Thở Tĩnh Lặng (2-1)',
    description:
      'Thở ra dài hơn hít vào giúp làm dịu dây thần kinh phế vị và đưa cơ thể về trạng thái nghỉ ngơi.',
    benefit: 'Xoa dịu stress',
    pattern: { inhale: 4, hold1: 0, exhale: 8, hold2: 0 },
    color: 'bg-teal-500',
  },
  {
    id: 'wim-hof',
    name: 'Wim Hof (Cơ bản)',
    description:
      "Phương pháp của 'Người băng' Wim Hof. Hít sâu nhanh rồi giữ hơi lâu, tăng cường hệ miễn dịch và sức chịu đựng.",
    benefit: 'Tăng sức chịu đựng',
    pattern: { inhale: 2, hold1: 10, exhale: 4, hold2: 0 },
    color: 'bg-cyan-500',
  },
  {
    id: 'pranayama',
    name: 'Pranayama (Yoga)',
    description:
      'Kỹ thuật thở cổ điển trong Yoga. Hít vào sâu, giữ hơi, thở ra chậm để cân bằng năng lượng Prana trong cơ thể.',
    benefit: 'Cân bằng năng lượng',
    pattern: { inhale: 4, hold1: 4, exhale: 6, hold2: 2 },
    color: 'bg-amber-500',
  },
  {
    id: 'sleep',
    name: 'Thở Vào Giấc Ngủ',
    description:
      'Biến thể chậm hơn của 4-7-8, kéo dài hơi thở ra giúp thả lỏng hoàn toàn và dễ chìm vào giấc ngủ sâu.',
    benefit: 'Ngủ sâu',
    pattern: { inhale: 4, hold1: 7, exhale: 11, hold2: 0 },
    color: 'bg-violet-500',
  },
  {
    id: 'coherent',
    name: 'Thở Đồng Bộ',
    description:
      'Nhịp thở đều 5-5 giây giúp hệ thần kinh ổn định, làm tốt khả năng tự điều hòa và duy trì trạng thái cân bằng.',
    benefit: 'Cân bằng toàn thân',
    pattern: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 },
    color: 'bg-sky-500',
  },
  {
    id: 'physiological-sigh',
    name: 'Thở Hồi Phục Nhanh',
    description:
      'Hít vào hai nhịp liên tiếp rồi thở ra dài để xả căng thẳng nhanh, rất hữu ích khi bạn cảm thấy quá tải hoặc bí bách.',
    benefit: 'Hạ căng thẳng nhanh',
    pattern: { inhale: 2, hold1: 1, exhale: 6, hold2: 0 },
    color: 'bg-lime-500',
  },
  {
    id: 'alternate-nostril',
    name: 'Thở Luân Phiên Mũi',
    description:
      'Kỹ thuật thay phiên đường thở qua hai bên mũi giúp làm dịu tâm trí, cân bằng năng lượng và giảm cảm giác xao động.',
    benefit: 'Cân bằng & lắng dịu',
    pattern: { inhale: 4, hold1: 0, exhale: 4, hold2: 0 },
    color: 'bg-fuchsia-500',
  },
  {
    id: 'ocean',
    name: 'Thở Mím Môi',
    description:
      'Cleveland Clinic hướng dẫn hít bằng mũi 2 giây rồi thở ra qua môi chụm 4 giây để làm chậm nhịp thở và dễ thở hơn.',
    benefit: 'Dễ thở & ổn định',
    sourceLabel: 'Cleveland Clinic',
    sourceUrl: 'https://my.clevelandclinic.org/health/diseases_conditions/hic_Understanding_COPD/hic_Pulmonary_Rehabilitation_Is_it_for_You/hic_Pursed_Lip_Breathing',
    pattern: { inhale: 2, hold1: 0, exhale: 4, hold2: 0 },
    color: 'bg-cyan-600',
  },
];
