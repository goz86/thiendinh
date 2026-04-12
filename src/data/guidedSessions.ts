export interface GuidedStep {
  /** Seconds from session start when this step appears */
  timeOffset: number;
  /** The guidance text to display */
  text: string;
  /** How long this text stays visible (seconds) */
  duration: number;
}

export interface GuidedSession {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Total duration in minutes */
  totalDuration: number;
  /** Which breathing technique to pair with */
  techniqueId: string;
  steps: GuidedStep[];
}

export const guidedSessions: GuidedSession[] = [
  {
    id: 'body-scan',
    name: 'Quét Thân',
    description: 'Lần lượt nhận biết từng phần cơ thể, buông lỏng mọi căng thẳng.',
    icon: '🧘',
    totalDuration: 5,
    techniqueId: 'diaphragmatic',
    steps: [
      { timeOffset: 0, text: 'Nhắm mắt lại... thả lỏng toàn thân.', duration: 12 },
      { timeOffset: 14, text: 'Cảm nhận đôi bàn chân đang chạm xuống mặt đất.', duration: 15 },
      { timeOffset: 32, text: 'Hãy để ý đến đầu gối và đùi... thả lỏng chúng đi.', duration: 15 },
      { timeOffset: 50, text: 'Di chuyển sự chú ý lên vùng bụng... cảm nhận hơi thở phồng xẹp.', duration: 18 },
      { timeOffset: 72, text: 'Giờ đến vùng ngực... để hơi thở nhẹ nhàng mở rộng lồng ngực.', duration: 16 },
      { timeOffset: 92, text: 'Thả lỏng vai... cổ... hàm... trán.', duration: 15 },
      { timeOffset: 110, text: 'Cảm nhận toàn thân như đang được nâng đỡ nhẹ nhàng.', duration: 18 },
      { timeOffset: 132, text: 'Hít vào... cảm ơn cơ thể đã đồng hành cùng bạn.', duration: 15 },
      { timeOffset: 150, text: 'Thở ra... buông bỏ mọi mệt mỏi.', duration: 15 },
      { timeOffset: 170, text: 'Hít vào sự nhẹ nhàng... Thở ra sự biết ơn.', duration: 18 },
      { timeOffset: 192, text: 'Cảm nhận sự tĩnh lặng lan tỏa khắp cơ thể.', duration: 20 },
      { timeOffset: 216, text: 'Bạn an toàn... bạn bình yên... ngay lúc này.', duration: 18 },
      { timeOffset: 240, text: 'Từ từ cảm nhận lại không gian xung quanh...', duration: 15 },
      { timeOffset: 260, text: 'Cử động nhẹ ngón tay... ngón chân.', duration: 12 },
      { timeOffset: 276, text: 'Khi sẵn sàng, hãy mở mắt ra. Buổi thiền đã hoàn thành. 🙏', duration: 20 },
    ],
  },
  {
    id: 'metta',
    name: 'Quán Từ Bi',
    description: 'Gửi tình thương đến bản thân và mọi người xung quanh.',
    icon: '💚',
    totalDuration: 7,
    techniqueId: 'resonant',
    steps: [
      { timeOffset: 0, text: 'Hãy ngồi thoải mái... nhắm mắt và thở nhẹ.', duration: 15 },
      { timeOffset: 18, text: 'Nghĩ đến bản thân mình... hình dung khuôn mặt mình đang mỉm cười.', duration: 18 },
      { timeOffset: 40, text: '"Cầu mong tôi được an lành... được hạnh phúc."', duration: 20 },
      { timeOffset: 64, text: '"Cầu mong tôi thoát khỏi khổ đau... được tự tại."', duration: 20 },
      { timeOffset: 88, text: 'Bây giờ, nghĩ đến người bạn thương yêu nhất.', duration: 15 },
      { timeOffset: 106, text: '"Cầu mong bạn được an lành... được hạnh phúc."', duration: 20 },
      { timeOffset: 130, text: '"Cầu mong bạn thoát khỏi khổ đau... được tự tại."', duration: 20 },
      { timeOffset: 155, text: 'Mở rộng tình thương đến một người bạn bình thường... không thân, không sơ.', duration: 18 },
      { timeOffset: 178, text: '"Cầu mong bạn cũng được an lành, hạnh phúc."', duration: 18 },
      { timeOffset: 200, text: 'Giờ hãy nghĩ đến một người khiến bạn khó chịu...', duration: 15 },
      { timeOffset: 220, text: 'Thử gửi đến họ lời chúc: "Cầu mong bạn cũng được bình an."', duration: 22 },
      { timeOffset: 248, text: 'Bây giờ, mở rộng ra tất cả chúng sinh trên trái đất...', duration: 18 },
      { timeOffset: 270, text: '"Cầu mong tất cả chúng sinh đều được an lành."', duration: 20 },
      { timeOffset: 296, text: '"Cầu mong tất cả đều thoát khỏi khổ đau."', duration: 20 },
      { timeOffset: 320, text: 'Cảm nhận tình thương đang lan tỏa từ trái tim bạn...', duration: 20 },
      { timeOffset: 346, text: 'Hít vào tình yêu thương... Thở ra sự bình an.', duration: 18 },
      { timeOffset: 370, text: 'Từ từ mở mắt... mang theo tình thương vào cuộc sống. 💚', duration: 20 },
    ],
  },
  {
    id: 'letting-go',
    name: 'Buông Xả',
    description: 'Nhận diện và buông bỏ những gánh nặng trong tâm trí.',
    icon: '🍃',
    totalDuration: 5,
    techniqueId: 'calm',
    steps: [
      { timeOffset: 0, text: 'Tìm cho mình một tư thế thoải mái nhất...', duration: 12 },
      { timeOffset: 15, text: 'Hít vào sâu qua mũi... Thở ra chậm qua miệng.', duration: 15 },
      { timeOffset: 34, text: 'Hãy nghĩ đến một điều đang khiến bạn nặng lòng...', duration: 18 },
      { timeOffset: 56, text: 'Không phán xét... chỉ nhận ra nó đang ở đó.', duration: 15 },
      { timeOffset: 75, text: 'Hình dung gánh nặng đó là một chiếc lá trên dòng nước...', duration: 18 },
      { timeOffset: 97, text: 'Mỗi lần thở ra, chiếc lá trôi xa thêm một chút.', duration: 18 },
      { timeOffset: 119, text: 'Bạn không cần giữ nó... hãy để nó đi.', duration: 15 },
      { timeOffset: 138, text: 'Hít vào sự nhẹ nhõm... Thở ra sự buông bỏ.', duration: 18 },
      { timeOffset: 160, text: 'Cảm nhận không gian rộng mở trong trái tim.', duration: 18 },
      { timeOffset: 182, text: 'Bạn xứng đáng được nhẹ nhàng... được tự do.', duration: 16 },
      { timeOffset: 202, text: 'Mỗi hơi thở là một sự bắt đầu mới.', duration: 15 },
      { timeOffset: 221, text: 'Thở ra... "Tôi buông bỏ."', duration: 15 },
      { timeOffset: 240, text: 'Hít vào... "Tôi tự do."', duration: 14 },
      { timeOffset: 258, text: 'Cảm nhận sự bình yên đang lan tỏa...', duration: 18 },
      { timeOffset: 280, text: 'Khi sẵn sàng, mở mắt ra. Bạn đã buông nhẹ được rồi. 🍃', duration: 18 },
    ],
  },
];
