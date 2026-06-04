import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Upload,
  Avatar,
  Card,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Descriptions,
} from "antd";
import { UserOutlined, UploadOutlined, SaveOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { updateUser } from "../../store/slices/authSlice";
import api from "../../utils/api";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/profile");
        const p = res.data.user;
        setProfile(p);
        form.setFieldsValue({
          full_name: p.full_name,
          phone: p.phone,
          birthday: p.birthday ? dayjs(p.birthday) : null,
          gender: p.gender || undefined,
          address: p.address || "",
        });
      } catch (err) {
        message.error("Lỗi tải hồ sơ cá nhân");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [form]);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (values.full_name) formData.append("full_name", values.full_name);
      if (values.phone) formData.append("phone", values.phone);
      if (values.birthday) formData.append("birthday", values.birthday.format("YYYY-MM-DD"));
      if (values.gender) formData.append("gender", values.gender);
      if (values.address !== undefined) formData.append("address", values.address);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await api.put("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = res.data.user;
      setProfile(updatedUser);
      dispatch(updateUser(updatedUser));
      setAvatarFile(null);
      setAvatarPreview(null);
      message.success("Cập nhật hồ sơ thành công!");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Cập nhật thất bại";
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (info: any) => {
    const file = info.file;
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  const avatarUrl = avatarPreview
    ? avatarPreview
    : profile?.avatar
    ? `http://localhost:5000${profile.avatar}`
    : undefined;

  return (
    <div>
      <Title level={3}>
        <UserOutlined style={{ marginRight: 8 }} />
        Hồ sơ cá nhân
      </Title>
      <Paragraph type="secondary">Cập nhật thông tin cá nhân và ảnh đại diện của bạn.</Paragraph>

      <Row gutter={[24, 24]}>
        {/* Cột avatar + thông tin tài khoản */}
        <Col xs={24} md={8}>
          <Card style={{ textAlign: "center" }}>
            <Avatar
              size={120}
              src={avatarUrl}
              icon={!avatarUrl && <UserOutlined />}
              style={{ marginBottom: 16, backgroundColor: "#1890ff" }}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {profile?.full_name}
              </Title>
              <Text type="secondary">{profile?.email}</Text>
            </div>

            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                handleAvatarChange({ file });
                return false; // Không upload tự động
              }}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} style={{ marginTop: 16 }}>
                Đổi ảnh đại diện
              </Button>
            </Upload>

            <Descriptions
              column={1}
              size="small"
              style={{ marginTop: 16, textAlign: "left" }}
            >
              <Descriptions.Item label="Vai trò">Học viên</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Text style={{ color: profile?.status === "hoạt động" ? "#52c41a" : "#ff4d4f" }}>
                  {profile?.status}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo TK">
                {new Date(profile?.created_at).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Cột form chỉnh sửa */}
        <Col xs={24} md={16}>
          <Card title="Chỉnh sửa thông tin">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              size="large"
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="full_name"
                    label="Họ và Tên"
                    rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                  >
                    <Input placeholder="Họ và Tên" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
                  >
                    <Input placeholder="Số điện thoại" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="birthday" label="Ngày sinh">
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                      placeholder="Chọn ngày sinh"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="gender" label="Giới tính">
                    <Select placeholder="Chọn giới tính" allowClear>
                      <Option value="nam">Nam</Option>
                      <Option value="nữ">Nữ</Option>
                      <Option value="khác">Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="address" label="Địa chỉ">
                <Input.TextArea rows={3} placeholder="Địa chỉ" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  style={{ borderRadius: 6 }}
                >
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
