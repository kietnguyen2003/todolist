# Tea Pret

Ứng dụng React Native + Expo cho todo và thói quen hằng ngày, dùng chung Plus Jakarta Sans, Feather và theme kem/navy/hồng.

## Chạy để xem

Yêu cầu Node.js >= 22.13 và npm.

```sh
npm install
npm run web
# Hoặc chạy trên điện thoại / simulator:
npm start
```

Mở bằng Expo Go tương thích SDK 57, hoặc nhấn `i` / `a` để chạy trên iOS Simulator / Android Emulator đã cài.

## Vercel và màn hình chính iPhone

`npm run build:web` xuất bản web tĩnh vào `dist/`. `vercel.json` đã đặt Framework Preset **Other**, build command `npm run build:web` và output directory `dist`; không cần backend hay biến môi trường. File `public/index.html` khai báo tiếng Việt, chế độ standalone, màu nền/khung hệ thống và safe area; `public/manifest.json` cùng `public/apple-touch-icon.png` đặt tên và biểu tượng khi thêm vào màn hình chính.

Sau khi kết nối dự án với tài khoản Vercel, triển khai từ thư mục gốc bằng Vercel CLI (`vercel` cho preview, `vercel --prod` cho địa chỉ production). Trên iPhone, mở **địa chỉ production cố định** bằng Safari, chọn **Chia sẻ → Thêm vào Màn hình chính** và bật **Mở như ứng dụng web** nếu iOS hiển thị tùy chọn này. Ứng dụng cần mạng để tải giao diện khi khởi động; chưa cấu hình cache offline/service worker.

Dữ liệu công việc và thói quen vẫn chỉ lưu trong bộ nhớ trình duyệt trên thiết bị. Ứng dụng thêm vào màn hình chính có vùng lưu trữ **riêng** với Safari; dữ liệu đã nhập trong tab Safari không tự chuyển sang biểu tượng mới. Preview URL, địa chỉ production và tên miền riêng cũng là các nguồn lưu trữ tách biệt. Hãy bắt đầu nhập dữ liệu trong biểu tượng Home Screen tại địa chỉ production sẽ dùng lâu dài. Xóa biểu tượng/website data có thể xóa dữ liệu; hiện chưa có tài khoản, đồng bộ hay sao lưu.

Mở ứng dụng là vào thẳng **Hôm nay**, không cần tài khoản, email hoặc mật khẩu. Dữ liệu cá nhân được đọc từ bộ nhớ máy trước khi hiển thị. Android Back từ Lịch quay về Hôm nay; ở Hôm nay dùng hành vi Back mặc định của hệ điều hành. Dự án không dùng thư viện navigation; `App.tsx` quản lý Hôm nay/Lịch bằng state.

## Today

- Chọn một ngày trong tuần, vuốt trái/phải hoặc dùng mũi tên để đổi tuần. Khi sang tuần sau chọn ngày đầu tuần, sang tuần trước chọn ngày cuối tuần; nếu trở về tuần hiện tại sẽ chọn hôm nay hoặc trở về hôm nay. Chuyển động đang chạy sẽ được hủy khi chọn ngày mới. Các ngày dùng lịch địa phương, không chuyển qua UTC.
- Công việc có ngày cụ thể, có thể không đặt giờ. Nút **Thêm công việc** trong danh sách Hôm nay mở form nhanh ở chế độ **Không có giờ**; có thể đổi ngày hoặc bật **Có giờ** để chọn bắt đầu/kết thúc. Tick/bỏ tick cập nhật ngay với chuyển động nhẹ; ngày không có dữ liệu hiển thị trạng thái trống.
- Habit là định nghĩa hằng ngày; số lượng đã thực hiện lưu riêng cho từng ngày. Dùng +/- hoặc bấm trực tiếp vào số liệu (ví dụ **6 / 8 cốc**) để nhập số lượng, từ 0 đến 100.000. Cho phép vượt mục tiêu; thanh tiến độ tối đa 100%.
- Streak tính từ các ngày liên tiếp đạt mục tiêu. Ngày đang chọn chưa xong: lửa trắng trên nền navy và số ngày đã duy trì đến hôm trước. Đã xong: lửa hồng đậm và số ngày tính cả ngày đang chọn. Bỏ lỡ một ngày sẽ ngắt chuỗi; sửa số lượng trong quá khứ cập nhật lại streak theo dữ liệu.
- **Thêm thói quen** yêu cầu tên 1–60 ký tự, mục tiêu nguyên 1–100.000 và đơn vị 1–20 ký tự (cốc, phút, trang, lần...). Habit mới bắt đầu từ ngày đang chọn và xuất hiện ở các ngày sau, tiến độ ban đầu bằng 0.
- Hai danh sách thu gọn/mở rộng bằng chuyển động ngắn, giữ bản nháp đang nhập. Thanh tiến độ habit chuyển nhẹ khi cập nhật; tôn trọng cài đặt giảm chuyển động của hệ điều hành.
- Thanh điều hướng **Hôm nay / Công việc / Thói quen / Lịch** chọn phần hoặc màn tương ứng. Web từ 900px dùng thanh trên và hai cột; web hẹp và native dùng thanh dưới, danh sách xếp dọc.
- Ứng dụng bắt đầu với danh sách trống. Công việc, thói quen và tiến độ tự lưu trên máy bằng AsyncStorage (web dùng localStorage của trình duyệt). Tải lại ứng dụng vẫn giữ dữ liệu. Không lưu mật khẩu; dữ liệu dùng chung trên thiết bị/trình duyệt này, chưa có tài khoản hoặc đồng bộ backend. Xóa dữ liệu ứng dụng/trình duyệt sẽ xóa dữ liệu đã lưu. Nếu không đọc/ghi được, ứng dụng báo lỗi và cho thử lại, không tự ghi đè dữ liệu lỗi.

## Lịch

Bấm **Lịch** trên thanh điều hướng hiện có. Đầu trang ghi khoảng ngày của tuần, ví dụ **28 Thg 9 – 4 Thg 10**. Nút **Hôm nay** quay về tuần hiện tại; mũi tên chuyển tuần và bấm ngày ở đầu cột lịch để chọn. Trên điện thoại, lịch giờ cuộn ngang với cột ngày đủ rộng; trên web đủ rộng hiển thị cả tuần, còn cửa sổ nhỏ vẫn cho cuộn ngang để giữ sự kiện dễ đọc. Cuộn dọc để xem 24 giờ, bấm sự kiện để xem ngày và giờ bắt đầu/kết thúc.

Sự kiện chồng giờ được chia cột cạnh nhau; ô ngắn có chiều cao tối thiểu 44px nên hình học của những sự kiện dưới khoảng 37 phút được mở rộng để dễ chạm. Giờ chính xác nằm trong chi tiết. Lịch lấy trực tiếp danh sách Công việc **có giờ** trong state của Hôm nay, không chứa công việc không giờ hoặc Thói quen. Tên, ngày, giờ bắt đầu và trạng thái hoàn thành dùng chung; công việc hoàn thành được gạch tên và có trạng thái trong chi tiết. Task cũ chỉ có giờ bắt đầu dùng thời lượng hiển thị tạm 30 phút (giới hạn đến 24:00), ghi rõ “Kết thúc (tạm tính)”. Nếu nguồn dữ liệu có `endTime`, lịch dùng giờ đó. Chạm ô giờ trống để tạo Công việc: ngày và giờ bắt đầu điền sẵn, giờ kết thúc mặc định sau 30 phút. Hai nhóm Bắt đầu/Kết thúc dùng cột cuộn giờ và phút; có nút thời lượng nhanh +30p, +1h và +1h30. Kết thúc 24:00 chỉ cho chọn phút 00. Lưu sẽ thêm task vào cả Lịch và Hôm nay; hủy không thay đổi dữ liệu. Chưa có sửa sự kiện hoặc API.

- `src/calendar/model.ts`: kiểu sự kiện, định dạng giờ, tính vị trí và chia cột khi chồng giờ.
- `src/calendar/TaskForm.tsx`: form tạo công việc dùng chung cho Hôm nay và ô giờ của Lịch, dùng validation và reducer chung.
- `src/calendar/taskEvents.ts`: chuyển dữ liệu Công việc thành ô lịch, không tạo bản sao state.
- `src/calendar/CalendarScreen.tsx`: màn lịch và chi tiết sự kiện, dùng theme/font/navigation có sẵn.
- `__tests__/calendar.test.ts`, `e2e/calendar.spec.ts`: kiểm tra logic bố cục và tương tác.

## Mã nguồn

- `App.tsx`: nạp font, SafeAreaProvider, route Today/Calendar và reducer và lưu trữ trên máy.
- `src/LoginScreen.tsx`, `src/validation.ts`: mã giao diện đăng nhập cũ, không còn được dùng trong luồng ứng dụng. Nếu dùng màn độc lập không truyền callback, vẫn hiện thông báo “Giao diện đăng nhập đã sẵn sàng”.
- `src/theme.ts`: màu sắc và font chung.
- `src/today/model.ts`: kiểu dữ liệu, lịch, kiểm tra habit, reducer và selector thuần.
- `src/storage/`: đọc/ghi dữ liệu trên máy, kiểm tra định dạng lưu trữ và khôi phục trước khi cho thao tác. Dữ liệu mẫu chỉ nằm trong fixtures phục vụ kiểm tra.
- `src/today/TodayScreen.tsx`, `TaskItem.tsx`, `TodayNavigation.tsx`, `useCalendarDay.ts`: bố cục, công việc, đồng bộ ngày địa phương khi qua nửa đêm và thanh điều hướng responsive.
- `src/today/WeekCalendar.tsx`, `Collapsible.tsx`, `HabitProgress.tsx`, `useReducedMotion.ts`: chuyển động lịch, danh sách và tiến độ có hỗ trợ giảm chuyển động.
- `src/today/HabitRow.tsx`, `HabitForm.tsx`, `ui.tsx`: cập nhật tiến độ, tạo habit và typography dùng chung.

## Kiểm tra

```sh
npm run typecheck
npm run test:coverage
npm run test:e2e
npx expo export --platform ios --platform android --output-dir /private/tmp/tung-buoc-native
```

E2E dùng Google Chrome đã cài và Python 3. Kiểm tra vào thẳng Hôm nay, lưu trữ trên máy, công việc có/không có giờ, tiến độ theo ngày, tạo habit, điều hướng và bố cục 320–1280px. Coverage chỉ đo logic thuần (`validation.ts`, `today/model.ts`, `calendar/model.ts`, `calendar/taskEvents.ts`, `storage/codec.ts`), không phải toàn bộ UI.

Đã đóng gói JavaScript cho web, iOS, Android. Chưa thử bàn phím ảo, VoiceOver/TalkBack hoặc cỡ chữ lớn trên thiết bị native. Màn đăng nhập/modal có keyboard avoidance; Today bật tự điều chỉnh keyboard inset trên iOS, Android dùng resize.

Lần audit gần nhất có 10 mục moderate trong chuỗi công cụ Expo → xcode → uuid, không có high/critical. Không dùng `npm audit fix --force` vì đề xuất này hạ Expo xuống SDK 46.
# todolist
