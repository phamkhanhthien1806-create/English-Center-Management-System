-- create database with entity and attribute
-- Hỗ trợ lưu trữ tiếng Việt đầy đủ với UTF-8
CREATE DATABASE english_center_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE english_center_management;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role ENUM('quản trị viên', 'học viên') NOT NULL,
    status ENUM('hoạt động', 'bị khóa') DEFAULT 'hoạt động',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE student_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    birthday DATE,
    gender ENUM('nam', 'nữ', 'khác'),
    address TEXT,
    avatar VARCHAR(255),

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE course_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    level VARCHAR(50),
    tuition_fee DECIMAL(10,2),
    duration VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES course_categories(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    specialization VARCHAR(100)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    max_students INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_class_dates CHECK (end_date >= start_date),

    FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE CASCADE,

    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE class_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    day_of_week ENUM(
        'Thứ Hai',
        'Thứ Ba',
        'Thứ Tư',
        'Thứ Năm',
        'Thứ Sáu',
        'Thứ Bảy',
        'Chủ Nhật'
    ) NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),

    CONSTRAINT chk_schedule_times CHECK (end_time > start_time),

    FOREIGN KEY (class_id) REFERENCES classes(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    enroll_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'chờ duyệt',
        'đã duyệt',
        'từ chối'
    ) DEFAULT 'chờ duyệt',

    UNIQUE(student_id, class_id),

    FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (class_id) REFERENCES classes(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    method_name VARCHAR(50) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT UNIQUE NOT NULL,
    payment_method_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,

    payment_status ENUM(
        'chờ thanh toán',
        'đã thanh toán',
        'thất bại'
    ) DEFAULT 'chờ thanh toán',

    payment_date TIMESTAMP NULL,

    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    lesson_title VARCHAR(255) NOT NULL,
    content TEXT,
    lesson_order INT,

    UNIQUE(class_id, lesson_order),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (class_id) REFERENCES classes(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE lesson_videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    duration INT,

    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE lesson_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    file_name VARCHAR(255),
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),

    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_id INT NOT NULL,

    score DECIMAL(5,2),

    comment TEXT,

    UNIQUE(student_id, class_id),

    CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 10),

    FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (class_id) REFERENCES classes(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================================
-- PHẦN DỮ LIỆU MẪU
-- Password mặc định đã băm bcrypt cho chuỗi 'password123'
-- =========================================================================

START TRANSACTION;

-- 1. BẢNG users (1 Admin + 25 Students = 26 rows)
INSERT INTO users (id, full_name, email, password, phone, role, status) VALUES
(1, 'Nguyễn Admin', 'admin@englishcenter.edu.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0901234567', 'quản trị viên', 'hoạt động'),
(2, 'Phạm Minh Anh', 'student2@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000002', 'học viên', 'hoạt động'),
(3, 'Lê Hoàng Bách', 'student3@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000003', 'học viên', 'hoạt động'),
(4, 'Trần Thu Cúc', 'student4@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000004', 'học viên', 'hoạt động'),
(5, 'Nguyễn Tiến Đạt', 'student5@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000005', 'học viên', 'hoạt động'),
(6, 'Vũ Thu Giang', 'student6@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000006', 'học viên', 'hoạt động'),
(7, 'Hoàng Quốc Huy', 'student7@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000007', 'học viên', 'hoạt động'),
(8, 'Bùi Minh Khoa', 'student8@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000008', 'học viên', 'hoạt động'),
(9, 'Đỗ Mai Lan', 'student9@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000009', 'học viên', 'hoạt động'),
(10, 'Phan Thanh Nam', 'student10@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000010', 'học viên', 'hoạt động'),
(11, 'Võ Thị Oanh', 'student11@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000011', 'học viên', 'hoạt động'),
(12, 'Trịnh Hồng Quân', 'student12@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000012', 'học viên', 'hoạt động'),
(13, 'Đặng Minh Sang', 'student13@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000013', 'học viên', 'hoạt động'),
(14, 'Ngô Quốc Thịnh', 'student14@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000014', 'học viên', 'hoạt động'),
(15, 'Mai Phương Thảo', 'student15@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000015', 'học viên', 'hoạt động'),
(16, 'Phùng Quốc Việt', 'student16@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000016', 'học viên', 'hoạt động'),
(17, 'Dương Gia Bảo', 'student17@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000017', 'học viên', 'hoạt động'),
(18, 'Lý Khánh An', 'student18@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000018', 'học viên', 'hoạt động'),
(19, 'Hồ Hoàng Long', 'student19@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000019', 'học viên', 'hoạt động'),
(20, 'Đoàn Cẩm Tú', 'student20@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000020', 'học viên', 'hoạt động'),
(21, 'Vương Thiên Phúc', 'student21@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000021', 'học viên', 'hoạt động'),
(22, 'Tạ Minh Trí', 'student22@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000022', 'học viên', 'hoạt động'),
(23, 'Nguyễn Hà Vy', 'student23@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000023', 'học viên', 'hoạt động'),
(24, 'Trần Đức Anh', 'student24@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000024', 'học viên', 'hoạt động'),
(25, 'Lê Hải Đăng', 'student25@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000025', 'học viên', 'hoạt động'),
(26, 'Nguyễn Ngọc Khánh', 'student26@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0910000026', 'học viên', 'hoạt động');

-- 2. BẢNG student_profiles (25 Students, không có cho Admin ID 1)
INSERT INTO student_profiles (id, user_id, birthday, gender, address, avatar) VALUES
(1, 2, '2002-05-15', 'nữ', '12 Đường Láng, Đống Đa, Hà Nội', '/uploads/avatars/student_2.jpg'),
(2, 3, '2001-08-20', 'nam', '45 Nguyễn Hữu Cảnh, Bình Thạnh, TP. Hồ Chí Minh', '/uploads/avatars/student_3.jpg'),
(3, 4, '2003-12-01', 'nữ', '78 Trần Phú, Hải Châu, Đà Nẵng', '/uploads/avatars/student_4.jpg'),
(4, 5, '2000-03-10', 'nam', '23 Lê Lợi, Ngô Quyền, Hải Phòng', '/uploads/avatars/student_5.jpg'),
(5, 6, '2002-07-25', 'nữ', '156 Đường 30 Tháng 4, Ninh Kiều, Cần Thơ', '/uploads/avatars/student_6.jpg'),
(6, 7, '2001-11-30', 'nam', '89 Quang Trung, Gò Vấp, TP. Hồ Chí Minh', '/uploads/avatars/student_7.jpg'),
(7, 8, '2004-02-14', 'nam', '54 Phố Huế, Hai Bà Trưng, Hà Nội', '/uploads/avatars/student_8.jpg'),
(8, 9, '2003-09-09', 'nữ', '32 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng', '/uploads/avatars/student_9.jpg'),
(9, 10, '2000-06-18', 'nam', '120 Điện Biên Phủ, Quận 1, TP. Hồ Chí Minh', '/uploads/avatars/student_10.jpg'),
(10, 11, '2002-10-05', 'nữ', '47 Kim Mã, Ba Đình, Hà Nội', '/uploads/avatars/student_11.jpg'),
(11, 12, '2001-04-22', 'nam', '66 Lê Duẩn, Hoàn Kiếm, Hà Nội', '/uploads/avatars/student_12.jpg'),
(12, 13, '2003-01-12', 'nam', '92 Cách Mạng Tháng 8, Quận 3, TP. Hồ Chí Minh', '/uploads/avatars/student_13.jpg'),
(13, 14, '2002-08-14', 'nam', '11 Lạch Tray, Ngô Quyền, Hải Phòng', '/uploads/avatars/student_14.jpg'),
(14, 15, '2001-09-29', 'nữ', '33 Nguyễn Văn Cừ, Long Biên, Hà Nội', '/uploads/avatars/student_15.jpg'),
(15, 16, '2000-12-25', 'nam', '77 Hùng Vương, Quy Nhơn, Bình Định', '/uploads/avatars/student_16.jpg'),
(16, 17, '2004-05-04', 'nam', '210 Nguyễn Trãi, Thanh Xuân, Hà Nội', '/uploads/avatars/student_17.jpg'),
(17, 18, '2003-07-11', 'nữ', '42 Lê Hồng Phong, Vũng Tàu, Bà Rịa - Vũng Tàu', '/uploads/avatars/student_18.jpg'),
(18, 19, '2001-10-31', 'nam', '18B Cộng Hòa, Tân Bình, TP. Hồ Chí Minh', '/uploads/avatars/student_19.jpg'),
(19, 20, '2002-02-28', 'nữ', '55 Phan Chu Trinh, Hội An, Quảng Nam', '/uploads/avatars/student_20.jpg'),
(20, 21, '2003-06-05', 'nam', '90 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh', '/uploads/avatars/student_21.jpg'),
(21, 22, '2000-11-20', 'nam', '36 Xuân Thủy, Cầu Giấy, Hà Nội', '/uploads/avatars/student_22.jpg'),
(22, 23, '2002-04-03', 'nữ', '14 Nguyễn Chí Thanh, Quận 10, TP. Hồ Chí Minh', '/uploads/avatars/student_23.jpg'),
(23, 24, '2001-01-27', 'nam', '85 Nguyễn Khuyến, Đống Đa, Hà Nội', '/uploads/avatars/student_24.jpg'),
(24, 25, '2003-08-15', 'nam', '19 Trần Phú, Nha Trang, Khánh Hòa', '/uploads/avatars/student_25.jpg'),
(25, 26, '2004-03-24', 'nữ', '124 Mê Linh, Vĩnh Yên, Vĩnh Phúc', '/uploads/avatars/student_26.jpg');

-- 3. BẢNG course_categories (6 danh mục)
INSERT INTO course_categories (id, category_name) VALUES
(1, 'TOEIC'),
(2, 'IELTS'),
(3, 'Giao tiếp'),
(4, 'Business English'),
(5, 'Grammar'),
(6, 'Kids');

-- 4. BẢNG courses (12 khóa học mẫu, mỗi danh mục có 2 khóa học)
INSERT INTO courses (id, category_id, course_name, level, tuition_fee, duration, description) VALUES
(1, 1, 'TOEIC Listening & Reading', 'Intermediate', 3000000.00, '2 tháng', 'Khóa học tập trung rèn luyện 2 kỹ năng Nghe và Đọc, giúp học viên đạt mục tiêu 450 - 650+ điểm TOEIC một cách hiệu quả.'),
(2, 1, 'TOEIC Speaking & Writing', 'Advanced', 3500000.00, '2 tháng', 'Khóa học rèn luyện chuyên sâu 2 kỹ năng Nói và Viết của bài thi TOEIC, phù hợp cho người đi làm cần giao tiếp chuyên nghiệp.'),
(3, 2, 'IELTS Foundation', 'Beginner', 4500000.00, '3 tháng', 'Khóa học cung cấp nền tảng kiến thức cơ bản về 4 kỹ năng trong bài thi IELTS, định hướng đạt band điểm 4.0 - 5.0.'),
(4, 2, 'IELTS Advanced', 'Advanced', 6000000.00, '3 tháng', 'Khóa học chuyên sâu rèn luyện chiến thuật làm bài ở mức độ khó, giúp học viên bứt phá đạt band điểm từ 6.0 đến 7.5+.'),
(5, 3, 'Everyday English Speaking', 'Beginner', 2500000.00, '2 tháng', 'Khóa học tiếng Anh giao tiếp đời thường, giúp học viên mất gốc lấy lại sự tự tin khi nói chuyện với người nước ngoài.'),
(6, 3, 'Real-Life English Communication', 'Intermediate', 3000000.00, '2.5 tháng', 'Khóa học giao tiếp trong các tình huống thực tế đời sống phức tạp, nâng cao phản xạ nói tự nhiên như người bản xứ.'),
(7, 4, 'Business English Basics', 'Intermediate', 4000000.00, '3 tháng', 'Khóa học trang bị vốn từ vựng và kỹ năng giao tiếp tiếng Anh cơ bản trong môi trường doanh nghiệp quốc tế.'),
(8, 4, 'English for Office Communication', 'Advanced', 4200000.00, '3 tháng', 'Khóa học tiếng Anh văn phòng chuyên nghiệp nâng cao, tập trung viết email, thuyết trình và đàm phán thương mại.'),
(9, 5, 'Practical Grammar Course', 'Beginner', 2000000.00, '1.5 tháng', 'Hệ thống hóa toàn bộ kiến thức ngữ pháp tiếng Anh từ cơ bản đến nâng cao một cách trực quan, dễ nhớ và thực tế.'),
(10, 5, 'Grammar for IELTS Writing', 'Intermediate', 3000000.00, '2 tháng', 'Khóa học chuyên sâu về ngữ pháp học thuật, cấu trúc câu phức tạp phục vụ trực tiếp cho phần thi IELTS Writing đạt điểm cao.'),
(11, 6, 'Fun English for Children', 'Beginner', 3500000.00, '4 tháng', 'Khóa học tiếng Anh vui nhộn dành cho trẻ em từ 6-10 tuổi thông qua trò chơi, bài hát và hoạt động tương tác sinh động.'),
(12, 6, 'Kids Vocabulary Builder', 'Beginner', 3200000.00, '3 tháng', 'Khóa học giúp trẻ phát triển vốn từ vựng phong phú theo các chủ đề gần gũi trong đời sống hàng ngày bằng phương pháp hiện đại.');

-- 5. BẢNG teachers (6 giáo viên với chuyên môn tương ứng)
INSERT INTO teachers (id, full_name, email, phone, specialization) VALUES
(1, 'Lê Quang Anh', 'quanganh.le@englishcenter.edu.vn', '0981111111', 'TOEIC'),
(2, 'Phạm Thu Thủy', 'thuthuy.pham@englishcenter.edu.vn', '0981111112', 'IELTS'),
(3, 'Johnathan Vance', 'john.vance@englishcenter.edu.vn', '0981111113', 'Giao tiếp'),
(4, 'Nguyễn Minh Trang', 'minhtrang.nguyen@englishcenter.edu.vn', '0981111114', 'Business English'),
(5, 'Hoàng Văn Minh', 'vanminh.hoang@englishcenter.edu.vn', '0981111115', 'Grammar'),
(6, 'Vũ Phương Ly', 'phuongly.vu@englishcenter.edu.vn', '0981111116', 'Kids English');

-- 6. BẢNG classes (12 lớp học, mỗi khóa có 1 lớp học tương ứng, mỗi giáo viên phụ trách đúng 2 lớp)
INSERT INTO classes (id, course_id, teacher_id, class_name, start_date, end_date, max_students) VALUES
(1, 1, 1, 'Lớp TOEIC L&R K15 - Thầy Anh', '2026-06-01', '2026-08-31', 30),
(2, 2, 1, 'Lớp TOEIC S&W K20 - Thầy Anh', '2026-06-01', '2026-08-31', 30),
(3, 3, 2, 'Lớp IELTS Foundation F08 - Cô Thủy', '2026-06-01', '2026-08-31', 30),
(4, 4, 2, 'Lớp IELTS Advanced A05 - Cô Thủy', '2026-06-01', '2026-08-31', 30),
(5, 5, 3, 'Lớp Everyday English E02 - Thầy John', '2026-06-01', '2026-08-31', 30),
(6, 6, 3, 'Lớp Real-Life Comm R04 - Thầy John', '2026-06-01', '2026-08-31', 30),
(7, 7, 4, 'Lớp Business English B11 - Cô Trang', '2026-06-01', '2026-08-31', 30),
(8, 8, 4, 'Lớp Office Comm O06 - Cô Trang', '2026-06-01', '2026-08-31', 30),
(9, 9, 5, 'Lớp Grammar Practical G03 - Thầy Minh', '2026-06-01', '2026-08-31', 30),
(10, 10, 5, 'Lớp Grammar for IELTS W09 - Thầy Minh', '2026-06-01', '2026-08-31', 30),
(11, 11, 6, 'Lớp Kids Fun English K01 - Cô Ly', '2026-06-01', '2026-08-31', 30),
(12, 12, 6, 'Lớp Kids Vocab Builder K05 - Cô Ly', '2026-06-01', '2026-08-31', 30);

-- 7. BẢNG class_schedules (24 lịch học, mỗi lớp 2 buổi/tuần)
INSERT INTO class_schedules (id, class_id, day_of_week, start_time, end_time, room) VALUES
-- Track A: Class 1, Class 4, Class 7
(1, 1, 'Thứ Hai', '18:00:00', '19:30:00', 'Phòng A101'),
(2, 1, 'Thứ Tư', '18:00:00', '19:30:00', 'Phòng A101'),
(3, 4, 'Thứ Năm', '18:00:00', '19:30:00', 'Phòng B102'),
(4, 4, 'Thứ Bảy', '18:00:00', '19:30:00', 'Phòng B102'),
(5, 7, 'Thứ Tư', '08:30:00', '10:00:00', 'Phòng D104'),
(6, 7, 'Thứ Bảy', '08:30:00', '10:00:00', 'Phòng D104'),

-- Track B: Class 2, Class 5, Class 8
(7, 2, 'Thứ Ba', '18:00:00', '19:30:00', 'Phòng A101'),
(8, 2, 'Thứ Năm', '18:00:00', '19:30:00', 'Phòng A101'),
(9, 5, 'Thứ Hai', '19:45:00', '21:15:00', 'Phòng C103'),
(10, 5, 'Thứ Sáu', '19:45:00', '21:15:00', 'Phòng C103'),
(11, 8, 'Thứ Năm', '08:30:00', '10:00:00', 'Phòng D104'),
(12, 8, 'Chủ Nhật', '08:30:00', '10:00:00', 'Phòng D104'),

-- Track C: Class 3, Class 6, Class 9
(13, 3, 'Thứ Tư', '18:00:00', '19:30:00', 'Phòng B102'),
(14, 3, 'Thứ Sáu', '18:00:00', '19:30:00', 'Phòng B102'),
(15, 6, 'Thứ Ba', '19:45:00', '21:15:00', 'Phòng C103'),
(16, 6, 'Thứ Bảy', '19:45:00', '21:15:00', 'Phòng C103'),
(17, 9, 'Thứ Sáu', '10:15:00', '11:45:00', 'Phòng E105'),
(18, 9, 'Chủ Nhật', '10:15:00', '11:45:00', 'Phòng E105'),

-- Track D: Class 10, Class 11, Class 12
(19, 10, 'Thứ Hai', '10:15:00', '11:45:00', 'Phòng E105'),
(20, 10, 'Thứ Năm', '10:15:00', '11:45:00', 'Phòng E105'),
(21, 11, 'Thứ Ba', '14:00:00', '15:30:00', 'Phòng F106'),
(22, 11, 'Thứ Sáu', '14:00:00', '15:30:00', 'Phòng F106'),
(23, 12, 'Thứ Tư', '14:00:00', '15:30:00', 'Phòng F106'),
(24, 12, 'Thứ Bảy', '14:00:00', '15:30:00', 'Phòng F106');

-- 8. BẢNG enrollments (60 lượt đăng ký, 25 học viên, mỗi học viên đăng ký trung bình 2-3 lớp)
INSERT INTO enrollments (id, student_id, class_id, status, enroll_date) VALUES
-- Học viên nhóm A (Học các lớp Track A: 1, 4, 7)
(1, 2, 1, 'đã duyệt', '2026-05-20 09:00:00'),
(2, 2, 4, 'đã duyệt', '2026-05-20 09:05:00'),
(3, 2, 7, 'đã duyệt', '2026-05-20 09:10:00'),
(4, 3, 1, 'đã duyệt', '2026-05-20 09:15:00'),
(5, 3, 4, 'đã duyệt', '2026-05-20 09:20:00'),
(6, 3, 7, 'đã duyệt', '2026-05-20 09:25:00'),
(7, 4, 1, 'đã duyệt', '2026-05-20 09:30:00'),
(8, 4, 4, 'đã duyệt', '2026-05-20 09:35:00'),
(9, 4, 7, 'đã duyệt', '2026-05-20 09:40:00'),
(10, 5, 1, 'đã duyệt', '2026-05-20 09:45:00'),
(11, 5, 4, 'đã duyệt', '2026-05-20 09:50:00'),
(12, 6, 1, 'đã duyệt', '2026-05-20 09:55:00'),
(13, 6, 4, 'đã duyệt', '2026-05-20 10:00:00'),
(14, 7, 1, 'đã duyệt', '2026-05-20 10:05:00'),
(15, 7, 4, 'đã duyệt', '2026-05-20 10:10:00'),

-- Học viên nhóm B (Học các lớp Track B: 2, 5, 8)
(16, 8, 2, 'đã duyệt', '2026-05-20 10:15:00'),
(17, 8, 5, 'đã duyệt', '2026-05-20 10:20:00'),
(18, 8, 8, 'đã duyệt', '2026-05-20 10:25:00'),
(19, 9, 2, 'đã duyệt', '2026-05-20 10:30:00'),
(20, 9, 5, 'đã duyệt', '2026-05-20 10:35:00'),
(21, 9, 8, 'đã duyệt', '2026-05-20 10:40:00'),
(22, 10, 2, 'đã duyệt', '2026-05-20 10:45:00'),
(23, 10, 5, 'đã duyệt', '2026-05-20 10:50:00'),
(24, 10, 8, 'đã duyệt', '2026-05-20 10:55:00'),
(25, 11, 2, 'đã duyệt', '2026-05-20 11:00:00'),
(26, 11, 5, 'đã duyệt', '2026-05-20 11:05:00'),
(27, 12, 2, 'đã duyệt', '2026-05-20 11:10:00'),
(28, 12, 5, 'đã duyệt', '2026-05-20 11:15:00'),
(29, 13, 2, 'đã duyệt', '2026-05-20 11:20:00'),
(30, 13, 5, 'đã duyệt', '2026-05-20 11:25:00'),

-- Học viên nhóm C (Học các lớp Track C: 3, 6, 9)
(31, 14, 3, 'đã duyệt', '2026-05-21 08:00:00'),
(32, 14, 6, 'đã duyệt', '2026-05-21 08:05:00'),
(33, 14, 9, 'đã duyệt', '2026-05-21 08:10:00'),
(34, 15, 3, 'đã duyệt', '2026-05-21 08:15:00'),
(35, 15, 6, 'đã duyệt', '2026-05-21 08:20:00'),
(36, 15, 9, 'đã duyệt', '2026-05-21 08:25:00'),
(37, 16, 3, 'đã duyệt', '2026-05-21 08:30:00'),
(38, 16, 6, 'đã duyệt', '2026-05-21 08:35:00'),
(39, 16, 9, 'đã duyệt', '2026-05-21 08:40:00'),
(40, 17, 3, 'đã duyệt', '2026-05-21 08:45:00'),
(41, 17, 6, 'đã duyệt', '2026-05-21 08:50:00'),
(42, 18, 3, 'đã duyệt', '2026-05-21 08:55:00'),
(43, 18, 6, 'đã duyệt', '2026-05-21 09:00:00'),
(44, 19, 3, 'đã duyệt', '2026-05-21 09:05:00'),
(45, 19, 6, 'đã duyệt', '2026-05-21 09:10:00'),

-- Học viên nhóm D (Học các lớp Track D: 10, 11, 12)
(46, 20, 10, 'đã duyệt', '2026-05-21 09:15:00'),
(47, 20, 11, 'đã duyệt', '2026-05-21 09:20:00'),
(48, 20, 12, 'đã duyệt', '2026-05-21 09:25:00'),
(49, 21, 10, 'đã duyệt', '2026-05-21 09:30:00'),
(50, 21, 11, 'đã duyệt', '2026-05-21 09:35:00'),
(51, 21, 12, 'đã duyệt', '2026-05-21 09:40:00'),
(52, 22, 10, 'đã duyệt', '2026-05-21 09:45:00'),
(53, 22, 11, 'đã duyệt', '2026-05-21 09:50:00'),
(54, 22, 12, 'chờ duyệt', '2026-05-21 09:55:00'),
(55, 23, 10, 'chờ duyệt', '2026-05-21 10:00:00'),
(56, 23, 11, 'chờ duyệt', '2026-05-21 10:05:00'),
(57, 24, 10, 'chờ duyệt', '2026-05-21 10:10:00'),
(58, 24, 11, 'chờ duyệt', '2026-05-21 10:15:00'),
(59, 25, 10, 'từ chối', '2026-05-21 10:20:00'),
(60, 25, 11, 'từ chối', '2026-05-21 10:25:00');

-- 9. BẢNG payment_methods (4 phương thức thanh toán)
INSERT INTO payment_methods (id, method_name) VALUES
(1, 'tiền mặt'),
(2, 'chuyển khoản'),
(3, 'ví điện tử'),
(4, 'thẻ ngân hàng');

-- 10. BẢNG payments (55 thông tin thanh toán, số tiền khớp với học phí lớp đã đăng ký)
INSERT INTO payments (id, enrollment_id, payment_method_id, amount, payment_status, payment_date) VALUES
(1, 1, 2, 3000000.00, 'đã thanh toán', '2026-05-21 14:00:00'),
(2, 2, 4, 6000000.00, 'đã thanh toán', '2026-05-21 14:02:00'),
(3, 3, 3, 4000000.00, 'đã thanh toán', '2026-05-21 14:05:00'),
(4, 4, 2, 3000000.00, 'đã thanh toán', '2026-05-21 14:10:00'),
(5, 5, 4, 6000000.00, 'đã thanh toán', '2026-05-21 14:12:00'),
(6, 6, 3, 4000000.00, 'đã thanh toán', '2026-05-21 14:15:00'),
(7, 7, 2, 3000000.00, 'đã thanh toán', '2026-05-21 14:20:00'),
(8, 8, 4, 6000000.00, 'đã thanh toán', '2026-05-21 14:22:00'),
(9, 9, 3, 4000000.00, 'đã thanh toán', '2026-05-21 14:25:00'),
(10, 10, 2, 3000000.00, 'đã thanh toán', '2026-05-21 14:30:00'),
(11, 11, 4, 6000000.00, 'đã thanh toán', '2026-05-21 14:32:00'),
(12, 12, 2, 3000000.00, 'đã thanh toán', '2026-05-21 14:35:00'),
(13, 13, 4, 6000000.00, 'đã thanh toán', '2026-05-21 14:37:00'),
(14, 14, 2, 3000000.00, 'đã thanh toán', '2026-05-21 14:40:00'),
(15, 15, 4, 6000000.00, 'đã thanh toán', '2026-05-21 14:42:00'),
(16, 16, 1, 3500000.00, 'đã thanh toán', '2026-05-21 14:45:00'),
(17, 17, 3, 2500000.00, 'đã thanh toán', '2026-05-21 14:47:00'),
(18, 18, 2, 4200000.00, 'đã thanh toán', '2026-05-21 14:50:00'),
(19, 19, 1, 3500000.00, 'đã thanh toán', '2026-05-21 14:52:00'),
(20, 20, 3, 2500000.00, 'đã thanh toán', '2026-05-21 14:55:00'),
(21, 21, 2, 4200000.00, 'đã thanh toán', '2026-05-21 14:57:00'),
(22, 22, 1, 3500000.00, 'đã thanh toán', '2026-05-21 15:00:00'),
(23, 23, 3, 2500000.00, 'đã thanh toán', '2026-05-21 15:02:00'),
(24, 24, 2, 4200000.00, 'đã thanh toán', '2026-05-21 15:05:00'),
(25, 25, 1, 3500000.00, 'đã thanh toán', '2026-05-21 15:07:00'),
(26, 26, 3, 2500000.00, 'đã thanh toán', '2026-05-21 15:10:00'),
(27, 27, 1, 3500000.00, 'đã thanh toán', '2026-05-21 15:12:00'),
(28, 28, 3, 2500000.00, 'đã thanh toán', '2026-05-21 15:15:00'),
(29, 29, 1, 3500000.00, 'đã thanh toán', '2026-05-21 15:17:00'),
(30, 30, 3, 2500000.00, 'đã thanh toán', '2026-05-21 15:20:00'),
(31, 31, 2, 4500000.00, 'đã thanh toán', '2026-05-21 15:22:00'),
(32, 32, 3, 3000000.00, 'đã thanh toán', '2026-05-21 15:25:00'),
(33, 33, 4, 2000000.00, 'đã thanh toán', '2026-05-21 15:27:00'),
(34, 34, 2, 4500000.00, 'đã thanh toán', '2026-05-21 15:30:00'),
(35, 35, 3, 3000000.00, 'đã thanh toán', '2026-05-21 15:32:00'),
(36, 36, 4, 2000000.00, 'đã thanh toán', '2026-05-21 15:35:00'),
(37, 37, 2, 4500000.00, 'đã thanh toán', '2026-05-21 15:37:00'),
(38, 38, 3, 3000000.00, 'đã thanh toán', '2026-05-21 15:40:00'),
(39, 39, 4, 2000000.00, 'đã thanh toán', '2026-05-21 15:42:00'),
(40, 40, 2, 4500000.00, 'đã thanh toán', '2026-05-21 15:45:00'),
(41, 41, 3, 3000000.00, 'đã thanh toán', '2026-05-21 15:47:00'),
(42, 42, 2, 4500000.00, 'đã thanh toán', '2026-05-21 15:50:00'),
(43, 43, 3, 3000000.00, 'đã thanh toán', '2026-05-21 15:52:00'),
(44, 44, 2, 4500000.00, 'đã thanh toán', '2026-05-21 15:55:00'),
(45, 45, 3, 3000000.00, 'đã thanh toán', '2026-05-21 15:57:00'),
(46, 46, 4, 3000000.00, 'đã thanh toán', '2026-05-21 16:00:00'),
(47, 47, 2, 3500000.00, 'đã thanh toán', '2026-05-21 16:02:00'),
(48, 48, 3, 3200000.00, 'đã thanh toán', '2026-05-21 16:05:00'),
(49, 49, 4, 3000000.00, 'đã thanh toán', '2026-05-21 16:07:00'),
(50, 50, 2, 3500000.00, 'đã thanh toán', '2026-05-21 16:10:00'),
(51, 51, 3, 3200000.00, 'thất bại', NULL),
(52, 52, 4, 3000000.00, 'thất bại', NULL),
(53, 53, 2, 3500000.00, 'chờ thanh toán', NULL),
(54, 54, 3, 3200000.00, 'chờ thanh toán', NULL),
(55, 55, 4, 3000000.00, 'chờ thanh toán', NULL);

-- 11. BẢNG lessons (60 bài học mẫu, mỗi lớp có 5 bài học mẫu)
INSERT INTO lessons (id, class_id, lesson_title, content, lesson_order) VALUES
-- Lớp 1: TOEIC L&R
(1, 1, 'Giới thiệu bài thi TOEIC Listening', 'Tổng quan về cấu trúc 4 phần thi Listening, cách phân bổ thời gian và thang điểm tính.', 1),
(2, 1, 'Kỹ thuật nghe tranh mô tả (Part 1)', 'Phân tích các bẫy thường gặp về động từ, danh từ mô tả tranh người và tranh vật.', 2),
(3, 1, 'Chiến thuật làm bài hỏi đáp (Part 2)', 'Cách nhận biết câu hỏi Wh-questions, câu hỏi Yes/No, câu trần thuật và phương pháp loại trừ.', 3),
(4, 1, 'Phương pháp nghe hội thoại ngắn (Part 3)', 'Cách đọc trước câu hỏi, định vị thông tin trong đoạn hội thoại giữa 2 hoặc 3 người nói.', 4),
(5, 1, 'Bí quyết đạt điểm tối đa bài nói ngắn (Part 4)', 'Phân tích các dạng bài nói một người như thông báo, tin nhắn thoại, bản tin thời tiết.', 5),

-- Lớp 2: TOEIC S&W
(6, 2, 'Tổng quan bài thi TOEIC Speaking & Writing', 'Giới thiệu định dạng phòng thi máy, tiêu chí chấm điểm kỹ năng Nói và Viết.', 1),
(7, 2, 'Luyện tập phát âm và ngữ điệu (Part 1-2)', 'Cách đọc to một đoạn văn trôi chảy và kỹ thuật mô tả tranh chi tiết trong thời gian ngắn.', 2),
(8, 2, 'Mô tả tranh và Trả lời câu hỏi (Part 3-4)', 'Phản xạ trả lời các câu hỏi phỏng vấn nhanh và sử dụng thông tin từ tài liệu cho trước.', 3),
(9, 2, 'Viết câu theo tranh và Trả lời thư điện tử', 'Cách viết câu đúng ngữ pháp dựa trên từ khóa gợi ý và viết email phản hồi lịch sự.', 4),
(10, 2, 'Viết bài luận thể hiện quan điểm cá nhân', 'Bố cục bài luận 300 từ thể hiện sự đồng ý hoặc không đồng ý với một nhận định xã hội.', 5),

-- Lớp 3: IELTS Foundation
(11, 3, 'Làm quen với format IELTS Academic', 'Giới thiệu chi tiết 4 phần thi IELTS Academic, cách chấm band điểm từ 1.0 đến 9.0.', 1),
(12, 3, 'Kỹ năng Đọc cơ bản - Skimming & Scanning', 'Luyện tập kỹ thuật đọc lướt tìm ý chính và đọc quét tìm thông tin chi tiết một cách nhanh chóng.', 2),
(13, 3, 'Nghe điền từ thông tin chi tiết (Section 1 & 2)', 'Cách ghi chép thông tin cá nhân như số điện thoại, ngày tháng, tên riêng không bị sai chính tả.', 3),
(14, 3, 'Viết câu mô tả biểu đồ cơ bản (Writing Task 1)', 'Cách sử dụng các động từ, danh từ chỉ sự tăng giảm để mô tả đường đồ thị và bảng biểu.', 4),
(15, 3, 'Nói giới thiệu bản thân trôi chảy (Speaking Part 1)', 'Chuẩn bị câu trả lời tự nhiên cho các chủ đề quen thuộc như gia đình, học tập, quê hương.', 5),

-- Lớp 4: IELTS Advanced
(16, 4, 'Chiến thuật nâng cao band điểm IELTS', 'Phân tích sự khác biệt giữa band 6.0 và band 7.5+, lập kế hoạch ôn tập nước rút.', 1),
(17, 4, 'Phân tích các dạng bài Reading phức tạp', 'Kỹ thuật xử lý dạng bài Matching Headings, True/False/Not Given vốn là ác mộng của học viên.', 2),
(18, 4, 'Bẫy thông tin nhiễu trong Listening (Section 3 & 4)', 'Phân tích các đoạn hội thoại học thuật phức tạp, bẫy sửa lời nói của nhân vật trong bài.', 3),
(19, 4, 'Phát triển luận điểm và viết cấu trúc phức (Task 2)', 'Cách xây dựng sơ đồ lập luận chặt chẽ và viết câu ghép câu phức ăn điểm từ vựng học thuật.', 4),
(20, 4, 'Phát triển ý tưởng dài cho Speaking Part 2 & 3', 'Phương pháp nói liên tục trong 2 phút dựa trên gợi ý từ thẻ cue card và phản biện phần 3.', 5),

-- Lớp 5: Everyday English Speaking
(21, 5, 'Chào hỏi và giới thiệu bản thân thông dụng', 'Luyện tập các mẫu câu chào hỏi trang trọng và thân mật, cách tạo ấn tượng tốt đầu tiên.', 1),
(22, 5, 'Giao tiếp chủ đề mua sắm và hỏi giá cả', 'Học các từ vựng về trang phục, kích cỡ, cách hỏi giá, mặc cả và thanh toán hóa đơn.', 2),
(23, 5, 'Cách hỏi và chỉ đường bằng tiếng Anh', 'Sử dụng các giới từ chỉ vị trí và câu khẩu lệnh chỉ đường rẽ trái, rẽ phải, đi thẳng.', 3),
(24, 5, 'Đặt bàn tại nhà hàng và gọi món ăn', 'Mẫu câu hội thoại đặt chỗ trước, chọn thực đơn và giao tiếp với phục vụ bàn tại nhà hàng.', 4),
(25, 5, 'Kỹ năng trò chuyện xã giao về thời tiết và sở thích', 'Cách mở đầu câu chuyện tự nhiên bằng chủ đề thời tiết, chia sẻ về thói quen cuối tuần.', 5),

-- Lớp 6: Real-Life English Communication
(26, 6, 'Giao tiếp thuyết phục trong đời sống', 'Cách trình bày ý kiến cá nhân một cách lịch sự, thuyết phục người nghe đồng thuận.', 1),
(27, 6, 'Cách bày tỏ quan điểm và thảo luận sự kiện', 'Mẫu câu đưa ra ý kiến phản bác nhẹ nhàng và thể hiện sự đồng tình trong các cuộc tranh luận.', 2),
(28, 6, 'Kỹ năng xử lý tình huống khẩn cấp', 'Cách gọi trợ giúp, báo mất đồ hoặc mô tả tình trạng sức khỏe khi gặp sự cố ở nước ngoài.', 3),
(29, 6, 'Giao tiếp qua điện thoại và đặt lịch hẹn', 'Cách bắt đầu cuộc gọi, để lại lời nhắn chuyên nghiệp và xác nhận lại thời gian hẹn gặp.', 4),
(30, 6, 'Độc thoại dài kể về một kỷ niệm đáng nhớ', 'Cách liên kết các câu chuyện kể ở thì quá khứ, truyền đạt cảm xúc sinh động đến người nghe.', 5),

-- Lớp 7: Business English Basics
(31, 7, 'Chào hỏi đối tác và giới thiệu doanh nghiệp', 'Mẫu câu tự tin đón tiếp đối tác, giới thiệu về sơ đồ tổ chức phòng ban trong công ty.', 1),
(32, 7, 'Từ vựng tiếng Anh chủ đề cuộc họp văn phòng', 'Nắm vững các thuật ngữ dùng để phát biểu, biểu quyết và tổng hợp ý kiến trong cuộc họp.', 2),
(33, 7, 'Cách viết email thương mại chuyên nghiệp', 'Quy tắc vàng về tiêu đề email, lời chào đầu thư, cách trình bày nội dung ngắn gọn và kết thư.', 3),
(34, 7, 'Mô tả sản phẩm và dịch vụ của công ty', 'Cách thuyết minh các tính năng nổi trội của sản phẩm để thu hút sự chú ý của khách hàng.', 4),
(35, 7, 'Kỹ năng đàm phán giá cả cơ bản', 'Cách đề xuất mức giá mong muốn, thương lượng chiết khấu và đưa ra nhượng bộ hợp lý.', 5),

-- Lớp 8: English for Office Communication
(36, 8, 'Thuyết trình dự án bằng tiếng Anh trôi chảy', 'Sử dụng các cụm từ nối chuyển slide, mô tả biểu đồ số liệu doanh thu trực quan, lôi cuốn.', 1),
(37, 8, 'Cách viết báo cáo kết quả kinh doanh quý', 'Cấu trúc bài viết báo cáo phân tích chi phí, lợi nhuận và kiến nghị chiến lược cho ban giám đốc.', 2),
(38, 8, 'Kỹ năng phỏng vấn tuyển dụng bằng tiếng Anh', 'Bí quyết trả lời các câu hỏi phỏng vấn hành vi kinhдени và cách hỏi lại nhà tuyển dụng.', 3),
(39, 8, 'Giải quyết tranh chấp và phản hồi khách hàng', 'Mẫu câu xoa dịu khách hàng khi gặp sự cố sản phẩm, đề xuất phương án bồi thường thỏa đáng.', 4),
(40, 8, 'Thảo luận hợp đồng và điều khoản thương mại', 'Đọc hiểu các điều khoản cốt lõi về giao hàng, bảo hành và ký kết hợp đồng bằng tiếng Anh.', 5),

-- Lớp 9: Practical Grammar Course
(41, 9, 'Hệ thống các thì hiện tại cơ bản', 'Phân biệt cách dùng, công thức của thì Hiện tại đơn, Hiện tại tiếp diễn và Hiện tại hoàn thành.', 1),
(42, 9, 'Các thì quá khứ và ứng dụng thực tế', 'Cách sử dụng kết hợp thì Quá khứ đơn và Quá khứ tiếp diễn khi kể lại chuỗi hành động.', 2),
(43, 9, 'Các thì tương lai và phân biệt will/be going to', 'Cách diễn đạt dự định, kế hoạch đã lên lịch trước và dự đoán dựa trên bằng chứng hiện tại.', 3),
(44, 9, 'Danh từ, đại từ và sự hòa hợp chủ vị', 'Quy tắc danh từ đếm được, không đếm được và các trường hợp chia động từ đặc biệt.', 4),
(45, 9, 'Tính từ, trạng từ và các cấu trúc so sánh', 'Cách cấu tạo trạng từ từ tính từ, so sánh hơn, so sánh nhất và so sánh kép.', 5),

-- Lớp 10: Grammar for IELTS Writing
(46, 10, 'Sử dụng mệnh đề quan hệ để viết câu phức', 'Cách kết hợp hai câu đơn sử dụng Who, Whom, Which, That và mệnh đề quan hệ rút gọn.', 1),
(47, 10, 'Cấu trúc câu bị động học thuật trong Writing', 'Biến đổi câu chủ động sang bị động khách quan (It is believed that...) thường dùng trong học thuật.', 2),
(48, 10, 'Ứng dụng mệnh đề phân từ rút gọn', 'Cách rút gọn hai mệnh đề chung chủ ngữ sử dụng V-ing (chủ động) hoặc V-ed (bị động).', 3),
(49, 10, 'Cấu trúc câu điều kiện loại 2, loại 3 và đảo ngữ', 'Diễn tả giả định trái ngược hiện tại/quá khứ và cách đảo ngữ nhấn mạnh trang trọng.', 4),
(50, 10, 'Sử dụng từ nối liên kết đoạn văn chặt chẽ', 'Các liên từ chỉ nguyên nhân - kết quả, tương phản, bổ sung thông tin giúp đoạn văn mạch lạc.', 5),

-- Lớp 11: Fun English for Children
(51, 11, 'Bảng chữ cái tiếng Anh vui nhộn', 'Nhận diện mặt chữ và phát âm chuẩn 26 chữ cái thông qua bài hát Phonics sôi động.', 1),
(52, 11, 'Các con số và đếm đồ vật xung quanh', 'Học đếm từ 1 đến 20 thông qua đếm số lượng bóng bay, kẹo ngọt có trong phòng học.', 2),
(53, 11, 'Học từ vựng màu sắc qua các bài hát', 'Nhận biết các màu sắc cơ bản đỏ, vàng, xanh qua trò chơi ghép tranh đầy sắc màu.', 3),
(54, 11, 'Tên gọi các loài động vật dễ thương', 'Học từ vựng về con chó, con mèo, con thỏ, con chim và mô phỏng tiếng kêu của chúng.', 4),
(55, 11, 'Giới thiệu các thành viên trong gia đình', 'Từ vựng gần gũi như bố, mẹ, anh, chị, em và mẫu câu đơn giản giới thiệu gia đình em.', 5),

-- Lớp 12: Kids Vocabulary Builder
(56, 12, 'Từ vựng chủ đề trường học của em', 'Nhận biết sách, vở, bút chì, thước kẻ, tẩy và gọi tên các phòng học cơ bản.', 1),
(57, 12, 'Tìm hiểu về các bộ phận trên cơ thể', 'Học từ vựng về mắt, mũi, tai, miệng, tay, chân qua bài hát vận động vui nhộn.', 2),
(58, 12, 'Tên gọi các món ăn và đồ uống yêu thích', 'Gọi tên sữa, nước ngọt, bánh mì, pizza, xúc xích và cách nói con thích món ăn nào.', 3),
(59, 12, 'Các loại phương tiện giao thông quen thuộc', 'Nhận biết xe đạp, xe máy, ô tô, xe buýt, máy bay và âm thanh chuyển động của chúng.', 4),
(60, 12, 'Từ vựng về thời tiết và các mùa trong năm', 'Tìm hiểu thời tiết nắng, mưa, nhiều mây, lạnh và cách chọn trang phục phù hợp.', 5);

-- 12. BẢNG lesson_videos (40 video bài giảng mẫu cho các bài học từ ID 1 đến 40)
INSERT INTO lesson_videos (id, lesson_id, video_url, duration) VALUES
(1, 1, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1800),
(2, 2, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2400),
(3, 3, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2700),
(4, 4, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3000),
(5, 5, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3600),
(6, 6, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2100),
(7, 7, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2400),
(8, 8, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2500),
(9, 9, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2800),
(10, 10, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3300),
(11, 11, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1900),
(12, 12, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2200),
(13, 13, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2600),
(14, 14, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3100),
(15, 15, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1800),
(16, 16, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2700),
(17, 17, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3300),
(18, 18, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3000),
(19, 19, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3600),
(20, 20, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3200),
(21, 21, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1200),
(22, 22, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1500),
(23, 23, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1600),
(24, 24, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1700),
(25, 25, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1400),
(26, 26, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2200),
(27, 27, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2400),
(28, 28, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1800),
(29, 29, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2000),
(30, 30, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2500),
(31, 31, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 1800),
(32, 32, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2100),
(33, 33, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2400),
(34, 34, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2200),
(35, 35, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2800),
(36, 36, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2900),
(37, 37, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3000),
(38, 38, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2600),
(39, 39, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 2700),
(40, 40, 'https://www.youtube.com/watch?v=2dA4Ju0uV5s', 3100);

-- 13. BẢNG lesson_materials (40 tài liệu đính kèm mẫu cho các bài học từ ID 11 đến 50)
INSERT INTO lesson_materials (id, lesson_id, file_name, file_url, file_type) VALUES
(1, 11, 'Slides_Gioi_Thieu_IELTS.pptx', '/uploads/Buoi 0.pdf', 'pdf'),
(2, 12, 'Bai_Tap_Luyen_Skimming.pdf', '/uploads/Buoi 1.pdf', 'pdf'),
(3, 13, 'Tu_Vung_Hay_Sai_Chinh_Ta.docx', '/uploads/Buoi 2.pdf', 'pdf'),
(4, 14, 'Cong_Thuc_Mo_Ta_Bieu_Do.pdf', '/uploads/Buoi 3.pdf', 'pdf'),
(5, 15, 'Bai_Mau_Speaking_Part_1.pdf', '/uploads/luật hấp amstrong.docx', 'docx'),
(6, 16, 'Cam_Nang_Nang_Band_IELTS.pdf', '/uploads/TẠO MÔI TRƯỜNG ẢO TRONG PYCHARM.docx', 'docx'),
(7, 17, 'Phan_Tich_Reading_Match_Headings.docx', '/uploads/XÂY DỰNG MỘT TỰA GAME BẰNG PYTHON.docx', 'docx'),
(8, 18, 'Nhung_Bay_Listening_Kinh_Dien.pdf', '/uploads/Buoi 0.pdf', 'pdf'),
(9, 19, 'Sodolap_luan_IELTS_Task_2.pptx', '/uploads/Buoi 1.pdf', 'pdf'),
(10, 20, 'Cue_Cards_Speaking_Part_2.pdf', '/uploads/Buoi 2.pdf', 'pdf'),
(11, 21, 'Mau_Cau_Chao_Hoi_Xa_Giao.pdf', '/uploads/Buoi 3.pdf', 'pdf'),
(12, 22, 'Tu_Vung_Chu_De_Shopping.docx', '/uploads/luật hấp amstrong.docx', 'docx'),
(13, 23, 'Ban_Do_Chi_Duong_Thuc_Hanh.pdf', '/uploads/TẠO MÔI TRƯỜNG ẢO TRONG PYCHARM.docx', 'docx'),
(14, 24, 'Thuc_Don_Nha_Hang_Mau.pptx', '/uploads/XÂY DỰNG MỘT TỰA GAME BẰNG PYTHON.docx', 'docx'),
(15, 25, 'Bai_Hoi_Thoai_Weather.docx', '/uploads/Buoi 0.pdf', 'pdf'),
(16, 26, 'Nghe_Thuat_Thuyet_Phuc.pdf', '/uploads/Buoi 1.pdf', 'pdf'),
(17, 27, 'Mau_Cau_Tranh_Luan_Tieng_Anh.pdf', '/uploads/Buoi 2.pdf', 'pdf'),
(18, 28, 'Cum_Tu_Cap_Cuu_Bao_Dong.docx', '/uploads/Buoi 3.pdf', 'pdf'),
(19, 29, 'Kich_Ban_Giao_Tiep_Qua_Dien_Thoai.pdf', '/uploads/luật hấp amstrong.docx', 'docx'),
(20, 30, 'Template_Dan_Y_Ke_Chuyen_Qua_Khu.docx', '/uploads/TẠO MÔI TRƯỜNG ẢO TRONG PYCHARM.docx', 'docx'),
(21, 31, 'Slides_Gioi_Thieu_Cong_Ty_Mau.pptx', '/uploads/XÂY DỰNG MỘT TỰA GAME BẰNG PYTHON.docx', 'docx'),
(22, 32, 'Thuat_Ngu_Hop_Van_Phong.pdf', '/uploads/Buoi 0.pdf', 'pdf'),
(23, 33, 'Templates_Email_Thuong_Mai.docx', '/uploads/Buoi 1.pdf', 'pdf'),
(24, 34, 'Bai_Thuyet_Minh_Product_Features.pptx', '/uploads/Buoi 2.pdf', 'pdf'),
(25, 35, 'Kich_Ban_Thuong_Luong_Gia.docx', '/uploads/Buoi 3.pdf', 'pdf'),
(26, 36, 'Slides_Thuyet_Trinh_So_Lieu.pptx', '/uploads/luật hấp amstrong.docx', 'docx'),
(27, 37, 'Mau_Bao_Cao_Tai_Chinh_Quy.xlsx', '/uploads/TẠO MÔI TRƯỜNG ẢO TRONG PYCHARM.docx', 'docx'),
(28, 38, 'Cau_Hoi_Phong_Van_Hanh_Vi.pdf', '/uploads/XÂY DỰNG MỘT TỰA GAME BẰNG PYTHON.docx', 'docx'),
(29, 39, 'Mau_Thu_Xin_Loi_Va_Den_Bu.docx', '/uploads/Buoi 0.pdf', 'pdf'),
(30, 40, 'Hop_Dong_Mua_Ban_Song_Ngu_Mau.pdf', '/uploads/Buoi 1.pdf', 'pdf'),
(31, 41, 'Binh_Do_He_Thong_Cac_Thi_Hien_Tai.pdf', '/uploads/Buoi 2.pdf', 'pdf'),
(32, 42, 'Bai_Tap_Chia_Thi_Qua_Khu.docx', '/uploads/Buoi 3.pdf', 'pdf'),
(33, 43, 'Phan_Biet_Will_BeGoingTo.pdf', '/uploads/luật hấp amstrong.docx', 'docx'),
(34, 44, 'Danh_Sach_Danh_Tu_Bat_Qui_Tac.pdf', '/uploads/TẠO MÔI TRƯỜNG ẢO TRONG PYCHARM.docx', 'docx'),
(35, 45, 'Cong_Thuc_So_Sanh_Kep.docx', '/uploads/XÂY DỰNG MỘT TỰA GAME BẰNG PYTHON.docx', 'docx'),
(36, 46, 'Slides_Relative_Clauses.pptx', '/uploads/Buoi 0.pdf', 'pdf'),
(37, 47, 'Bai_Tap_Cau_Bi_Dong_Khach_Quan.docx', '/uploads/Buoi 1.pdf', 'pdf'),
(38, 48, 'Phan_Tich_Rut_Gon_Menh_De.pdf', '/uploads/Buoi 2.pdf', 'pdf'),
(39, 49, 'Bang_Dao_Ngu_Cau_Dieu_Kien.pdf', '/uploads/Buoi 3.pdf', 'pdf'),
(40, 50, 'Danh_Sach_Tu_Noi_Lien_Ket.docx', '/uploads/luật hấp amstrong.docx', 'docx');

-- 14. BẢNG scores (45 điểm mẫu, tương ứng khớp với các học viên đã có trong enrollments)
INSERT INTO scores (student_id, class_id, score, comment) VALUES
(2, 1, 8.50, 'Tiến bộ vượt bậc ở kỹ năng nghe, cần luyện thêm đọc nhanh.'),
(2, 4, 7.80, 'Khả năng viết lập luận chặt chẽ, phát âm cần cải thiện ngữ điệu.'),
(2, 7, 9.00, 'Thuyết trình tự tin bằng tiếng Anh thương mại, từ vựng phong phú.'),
(3, 1, 6.50, 'Kỹ năng nghe trung bình khá, cần chú ý bẫy từ đồng âm Part 2.'),
(3, 4, 8.20, 'Đọc hiểu tốt các bài học thuật dài, kỹ năng nói trôi chảy.'),
(3, 7, 8.80, 'Viết thư thương mại rất tốt, đúng quy chuẩn chuyên nghiệp.'),
(4, 1, 9.20, 'Kỹ năng nghe và đọc đều xuất sắc, phát âm chuẩn.'),
(4, 4, 7.50, 'Viết còn mắc lỗi câu cụt, bù lại nói phản xạ tốt.'),
(4, 7, 8.50, 'Tương tác nhóm tốt, nắm chắc từ vựng kinh doanh quốc tế.'),
(5, 1, 7.00, 'Bài thi đạt yêu cầu tốt, cần nâng cao tốc độ đọc.'),
(5, 4, 6.80, 'Listening tốt nhưng Reading còn yếu ở các bài luận dài.'),
(6, 1, 8.00, 'Tiếp thu bài nhanh, làm bài thi thử đạt kết quả khả quan.'),
(6, 4, 9.00, 'Nói cực kỳ tự tin và trôi chảy, bài viết cấu trúc phức tạp.'),
(7, 1, 5.50, 'Cần cố gắng nhiều hơn, hay bị nhầm lẫn thì ở câu hỏi Part 2.'),
(7, 4, 7.20, 'Kỹ năng đọc khá, từ vựng phong phú nhưng phát âm còn ngập ngừng.'),
(8, 2, 7.50, 'Phát âm tốt, bài viết email đáp ứng đầy đủ yêu cầu đề bài.'),
(8, 5, 8.50, 'Phản xạ giao tiếp nhanh, tự tin trò chuyện với giáo viên bản xứ.'),
(8, 8, 8.00, 'Làm báo cáo kinh doanh rõ ràng, lập luận mạch lạc.'),
(9, 2, 8.80, 'Bài luận xuất sắc, lập luận chặt chẽ và sử dụng từ ngữ cao cấp.'),
(9, 5, 9.50, 'Nói tiếng Anh tự nhiên như người bản xứ, ngữ âm rất đẹp.'),
(9, 8, 9.00, 'Kỹ năng thuyết trình dự án lôi cuốn người nghe, slide đẹp.'),
(10, 2, 6.00, 'Nói còn ngập ngừng, cần chú ý lỗi ngữ pháp cơ bản khi viết.'),
(10, 5, 7.00, 'Lấy lại nền tảng giao tiếp nhanh chóng, cần chăm phát biểu hơn.'),
(10, 8, 7.80, 'Kỹ năng thảo luận nhóm và viết email đạt yêu cầu tốt.'),
(11, 2, 8.20, 'Độc thoại tốt, bài viết thư trôi chảy và mạch lạc.'),
(11, 5, 8.00, 'Giao tiếp chủ động, biết cách chỉ đường rõ ràng bằng tiếng Anh.'),
(12, 2, 7.00, 'Ngữ điệu đọc to rất tốt, bài viết email cần trau chuốt từ vựng.'),
(12, 5, 8.50, 'Đặt món ăn và giao tiếp nhà hàng rất tự nhiên, vui vẻ.'),
(13, 2, 9.20, 'Thành tích xuất sắc trong cả bài thi Nói lẫn Viết.'),
(13, 5, 9.00, 'Phản xạ giao tiếp cực nhanh, vốn từ vựng xã giao đa dạng.'),
(14, 3, 6.50, 'Kỹ năng nghe khá, kỹ năng đọc cần tích lũy thêm từ vựng.'),
(14, 6, 8.00, 'Đưa ra quan điểm rõ ràng, thuyết phục khi thảo luận sự kiện.'),
(14, 9, 8.80, 'Nắm rất chắc cấu trúc các thì tương lai và sự hòa hợp chủ vị.'),
(15, 3, 7.80, 'Mô tả biểu đồ cơ bản tốt, phát triển ý nói đầy đủ.'),
(15, 6, 8.50, 'Phản xạ xử lý tình huống khẩn cấp nhanh, dùng từ linh hoạt.'),
(15, 9, 9.20, 'Làm bài kiểm tra ngữ pháp so sánh kép và các thì đạt điểm tối đa.'),
(16, 3, 8.50, 'Listening xuất sắc, kỹ năng nói tự nhiên trôi chảy.'),
(16, 6, 9.00, 'Kể chuyện quá khứ đầy cảm xúc, biết cách sử dụng từ liên kết.'),
(16, 9, 9.50, 'Ngữ pháp chắc chắn, hầu như không mắc lỗi chia động từ.'),
(17, 3, 7.00, 'Đọc hiểu khá tốt, bài viết mô tả biểu đồ cần tăng tốc độ.'),
(17, 6, 7.50, 'Hẹn lịch qua điện thoại mạch lạc, cần sửa một số lỗi phát âm.'),
(18, 3, 6.00, 'Nghe chưa tốt ở Section 2, cần luyện nghe điền thông tin chi tiết.'),
(18, 6, 7.20, 'Bày tỏ quan điểm tốt nhưng nói còn hơi chậm, thiếu tự tin.'),
(19, 3, 8.00, 'Nói lưu loát Part 1, bài viết biểu đồ tương đối hoàn chỉnh.'),
(19, 6, 8.20, 'Kỹ năng giao tiếp qua điện thoại chuyên nghiệp, giọng điệu tự nhiên.');

-- 15. BẢNG notifications (60 thông báo mẫu thực tế)
INSERT INTO notifications (id, user_id, title, message, is_read) VALUES
(1, 1, 'Học viên mới đăng ký', 'Học viên Phạm Minh Anh đã đăng ký lớp học TOEIC L&R K15 thành công.', 0),
(2, 2, 'Lịch học sắp diễn ra', 'Lớp TOEIC L&R K15 của bạn sẽ bắt đầu sau 30 phút nữa tại Phòng A101.', 0),
(3, 2, 'Cập nhật tài liệu mới', 'Thầy Lê Quang Anh đã tải lên tài liệu "Kỹ thuật mô tả tranh Part 1" cho lớp của bạn.', 0),
(4, 2, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ của bạn ở lớp TOEIC L&R K15 đã được cập nhật: 8.50.', 0),
(5, 2, 'Xác nhận thanh toán học phí', 'Hệ thống đã nhận thành công 3,000,000đ học phí lớp TOEIC L&R K15.', 1),
(6, 3, 'Lịch học sắp diễn ra', 'Lớp TOEIC L&R K15 của bạn sẽ bắt đầu sau 30 phút nữa tại Phòng A101.', 0),
(7, 3, 'Cập nhật tài liệu mới', 'Tài liệu học tập mới "Kỹ thuật mô tả tranh Part 1" đã có sẵn để tải về.', 0),
(8, 3, 'Cập nhật điểm số', 'Điểm thi thử giữa kỳ lớp TOEIC L&R K15 của bạn đã được công bố: 6.50.', 1),
(9, 3, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp TOEIC L&R K15 của bạn đã được duyệt thành công.', 1),
(10, 4, 'Cập nhật điểm số', 'Điểm thi thử giữa kỳ lớp TOEIC L&R K15 của bạn đã được công bố: 9.20.', 0),
(11, 4, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp TOEIC L&R K15 của bạn đã được duyệt thành công.', 1),
(12, 5, 'Lịch học sắp diễn ra', 'Lớp TOEIC L&R K15 của bạn sẽ bắt đầu sau 30 phút nữa tại Phòng A101.', 0),
(13, 5, 'Cập nhật điểm số', 'Điểm thi thử giữa kỳ lớp TOEIC L&R K15 của bạn đã được công bố: 7.00.', 0),
(14, 5, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp TOEIC L&R K15 của bạn đã được duyệt thành công.', 1),
(15, 6, 'Cập nhật điểm số', 'Điểm thi thử giữa kỳ lớp TOEIC L&R K15 của bạn đã được công bố: 8.00.', 0),
(16, 6, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp TOEIC L&R K15 của bạn đã được duyệt thành công.', 1),
(17, 7, 'Cập nhật điểm số', 'Điểm thi thử giữa kỳ lớp TOEIC L&R K15 của bạn đã được công bố: 5.50.', 0),
(18, 7, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp TOEIC L&R K15 của bạn đã được duyệt thành công.', 1),
(19, 8, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp TOEIC S&W K20 của bạn đã được cập nhật: 7.50.', 0),
(20, 8, 'Cập nhật tài liệu mới', 'Giảng viên đã tải lên "Slides Tổng quan bài thi TOEIC SW" cho lớp học của bạn.', 0),
(21, 8, 'Xác nhận thanh toán học phí', 'Học phí lớp TOEIC S&W K20 đã được thanh toán thành công qua thẻ ngân hàng.', 1),
(22, 9, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp TOEIC S&W K20 của bạn đã được cập nhật: 8.80.', 0),
(23, 9, 'Xác nhận thanh toán học phí', 'Học phí lớp TOEIC S&W K20 đã được thanh toán thành công qua thẻ ngân hàng.', 1),
(24, 10, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp TOEIC S&W K20 của bạn đã được cập nhật: 6.00.', 0),
(25, 10, 'Xác nhận thanh toán học phí', 'Học phí lớp TOEIC S&W K20 đã được thanh toán thành công qua thẻ ngân hàng.', 1),
(26, 11, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp TOEIC S&W K20 của bạn đã được cập nhật: 8.20.', 0),
(27, 11, 'Xác nhận thanh toán học phí', 'Học phí lớp TOEIC S&W K20 đã được thanh toán thành công qua thẻ ngân hàng.', 1),
(28, 12, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp TOEIC S&W K20 của bạn đã được cập nhật: 7.00.', 0),
(29, 12, 'Xác nhận thanh toán học phí', 'Học phí lớp TOEIC S&W K20 đã được thanh toán thành công qua thẻ ngân hàng.', 1),
(30, 13, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp TOEIC S&W K20 của bạn đã được cập nhật: 9.20.', 0),
(31, 13, 'Xác nhận thanh toán học phí', 'Học phí lớp TOEIC S&W K20 đã được thanh toán thành công qua thẻ ngân hàng.', 1),
(32, 14, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp IELTS Foundation F08 đã được cập nhật: 6.50.', 0),
(33, 14, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp IELTS Foundation F08 đã được ghi nhận qua chuyển khoản.', 1),
(34, 15, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp IELTS Foundation F08 đã được cập nhật: 7.80.', 0),
(35, 15, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp IELTS Foundation F08 đã được ghi nhận qua chuyển khoản.', 1),
(36, 16, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp IELTS Foundation F08 đã được cập nhật: 8.50.', 0),
(37, 16, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp IELTS Foundation F08 đã được ghi nhận qua chuyển khoản.', 1),
(38, 17, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp IELTS Foundation F08 đã được cập nhật: 7.00.', 0),
(39, 17, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp IELTS Foundation F08 đã được ghi nhận qua chuyển khoản.', 1),
(40, 18, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp IELTS Foundation F08 đã được cập nhật: 6.00.', 0),
(41, 18, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp IELTS Foundation F08 đã được ghi nhận qua chuyển khoản.', 1),
(42, 19, 'Điểm số mới được cập nhật', 'Điểm thi giữa kỳ lớp IELTS Foundation F08 đã được cập nhật: 8.00.', 0),
(43, 19, 'Xác nhận thanh toán học phí', 'Thanh toán học phí lớp IELTS Foundation F08 đã được ghi nhận qua chuyển khoản.', 1),
(44, 20, 'Lớp học sắp bắt đầu', 'Lớp Grammar for IELTS W09 sắp bắt đầu lúc 10:15 tại Phòng E105.', 0),
(45, 20, 'Tải lên tài liệu đính kèm', 'Tài liệu "Relative Clauses Slides" đã được cập nhật lên hệ thống.', 0),
(46, 21, 'Lớp học sắp bắt đầu', 'Lớp Grammar for IELTS W09 sắp bắt đầu lúc 10:15 tại Phòng E105.', 0),
(47, 21, 'Tải lên tài liệu đính kèm', 'Tài liệu "Relative Clauses Slides" đã được cập nhật lên hệ thống.', 0),
(48, 22, 'Lớp học sắp bắt đầu', 'Lớp Grammar for IELTS W09 sắp bắt đầu lúc 10:15 tại Phòng E105.', 0),
(49, 22, 'Tải lên tài liệu đính kèm', 'Tài liệu "Relative Clauses Slides" đã được cập nhật lên hệ thống.', 0),
(50, 23, 'Thông báo từ hệ thống', 'Đơn đăng ký lớp học Grammar for IELTS W09 của bạn đang ở trạng thái chờ duyệt.', 0),
(51, 24, 'Thông báo từ hệ thống', 'Đơn đăng ký lớp học Grammar for IELTS W09 của bạn đang ở trạng thái chờ duyệt.', 0),
(52, 25, 'Thông báo từ hệ thống', 'Rất tiếc, đơn đăng ký lớp học Grammar for IELTS W09 của bạn đã bị từ chối.', 0),
(53, 26, 'Chào mừng học viên mới', 'Tài khoản của bạn đã được khởi tạo thành công trên hệ thống English Center.', 0),
(54, 2, 'Thay đổi lịch học đột xuất', 'Lớp học TOEIC L&R K15 ngày 25/06 sẽ chuyển từ phòng A101 sang phòng VIP1.', 0),
(55, 3, 'Thay đổi lịch học đột xuất', 'Lớp học TOEIC L&R K15 ngày 25/06 sẽ chuyển từ phòng A101 sang phòng VIP1.', 0),
(56, 4, 'Thay đổi lịch học đột xuất', 'Lớp học TOEIC L&R K15 ngày 25/06 sẽ chuyển từ phòng A101 sang phòng VIP1.', 0),
(57, 5, 'Thay đổi lịch học đột xuất', 'Lớp học TOEIC L&R K15 ngày 25/06 sẽ chuyển từ phòng A101 sang phòng VIP1.', 0),
(58, 6, 'Thay đổi lịch học đột xuất', 'Lớp học TOEIC L&R K15 ngày 25/06 sẽ chuyển từ phòng A101 sang phòng VIP1.', 0),
(59, 7, 'Thay đổi lịch học đột xuất', 'Lớp học TOEIC L&R K15 ngày 25/06 sẽ chuyển từ phòng A101 sang phòng VIP1.', 0),
(60, 1, 'Báo cáo tổng kết tuần', 'Đã có 60 lượt đăng ký học mới trong tuần qua cần được quản trị viên xử lý.', 0);

COMMIT;

-- =========================================================================
-- KIỂM TRA SỐ LƯỢNG BẢN GHI
-- =========================================================================

SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'student_profiles', COUNT(*) FROM student_profiles
UNION ALL
SELECT 'course_categories', COUNT(*) FROM course_categories
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'class_schedules', COUNT(*) FROM class_schedules
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 'lesson_videos', COUNT(*) FROM lesson_videos
UNION ALL
SELECT 'lesson_materials', COUNT(*) FROM lesson_materials
UNION ALL
SELECT 'scores', COUNT(*) FROM scores
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;