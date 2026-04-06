export const quotes: string[] = [
  "Thở vào, tôi biết tôi đang thở vào. Thở ra, tôi biết tôi đang thở ra. — Thích Nhất Hạnh",
  "Hạnh phúc là ở đây, ngay trong giây phút này. — Thích Nhất Hạnh",
  "Người đời nhớ ái dục, ưa thích các hỷ lạc. Tuy mong cầu an lạc, họ vẫn phải sanh già. — Kinh Pháp Cú",
  "An trú trong hiện tại, không truy tìm quá khứ, không ước vọng tương lai. — Kinh Nhất Dạ Hiền",
  "Tâm an thì vạn sự an. Tâm loạn thì vạn sự loạn.",
  "Khi bạn thở, bạn sống. Khi bạn thở có ý thức, bạn sống trọn vẹn.",
  "Thiền không phải là trốn chạy. Thiền là gặp gỡ bình an với chính mình.",
  "Mỗi hơi thở là một cơ hội để bắt đầu lại.",
  "Không gì quý hơn sự bình an trong tâm hồn.",
  "Buông bỏ không phải là mất đi, mà là tự do.",
  "Nước lặng thì trăng hiện. Tâm lặng thì trí sáng.",
  "Hãy là hòn đảo của chính mình, hãy nương tựa chính mình. — Đức Phật",
  "Giây phút hiện tại là giây phút duy nhất bạn thực sự sống.",
  "Thân thể là ngôi chùa, hơi thở là tiếng chuông.",
  "Đừng để một ngày trôi qua mà không có một phút lắng đọng.",
  "Hơi thở là cầu nối giữa sự sống và ý thức. — Thích Nhất Hạnh",
  "Mỉm cười đi, vì cuộc đời là một món quà. — Thích Nhất Hạnh",
  "Tự do đích thực là tự do khỏi những nỗi lo âu và sợ hãi.",
  "Đừng vội vã, hãy để mọi thứ diễn ra theo cách của nó.",
  "Sâu thẳm trong bạn là sự tĩnh lặng bao la.",
  "Lắng nghe hơi thở, bạn sẽ nghe thấy nhịp đập của vũ trụ.",
  "Mỗi bước chân trên mặt đất là một phép lạ. — Thích Nhất Hạnh",
  "Năng lượng của chánh niệm là năng lượng của sự hiện diện.",
  "Hãy đối xử với bản thân bằng sự dịu dàng như đối với một đóa hoa.",
  "Tâm bạn giống như mặt hồ, chỉ khi tĩnh lặng bạn mới thấy rõ đáy.",
  "Hạnh phúc không phải là đích đến, mà là hành trình chúng ta đang đi.",
  "Khi bạn thay đổi cách nhìn thế giới, thế giới bạn nhìn sẽ thay đổi.",
  "Bình yên đến từ bên trong, đừng tìm nó bên ngoài. — Đức Phật",
  "Quá khứ đã qua, tương lai chưa tới, chỉ có hiện tại là thật.",
  "Hãy thở để biết mình đang còn sống, và mỉm cười để biết mình đang hạnh phúc.",
  "Sức mạnh lớn nhất là sự tĩnh lặng của tâm hồn.",
  "Lòng biết ơn là khởi đầu của mọi sự giàu có và an lạc.",
  "Chỉ khi tâm ta tĩnh, ta mới nghe được tiếng nói của trái tim.",
  "Đừng tìm kiếm hạnh phúc ở nơi xa xôi, nó nằm ngay dưới chân bạn.",
  "Hơi thở nhẹ nhàng, tâm hồn thênh thang.",
  "Vạn sự tùy duyên, tâm bất biến giữa dòng đời vạn biến.",
  "Sống trọn vẹn từng khoảnh khắc, đó chính là thiền.",
  "Khi bạn biết đủ, bạn sẽ luôn thấy hạnh phúc.",
  "Ánh sáng của trí tuệ chỉ chiếu rọi khi bóng tối của bản ngã lùi xa.",
  "Hãy như một cái cây, đứng vững vàng nhưng vẫn linh hoạt trước gió.",
  "Lòng từ bi là liều thuốc chữa lành mọi nỗi đau.",
];

export const getRandomQuote = (): string => {
  return quotes[Math.floor(Math.random() * quotes.length)];
};

export const getDailyQuote = (): string => {
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % quotes.length;
  return quotes[dayIndex];
};
