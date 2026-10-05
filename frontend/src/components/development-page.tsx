type DevelopmentPageProps = { title: string; description: string };

export function DevelopmentPage({ title, description }: DevelopmentPageProps) {
  return <section><div className="page-heading"><p className="eyebrow">Module chức năng</p><h1>{title}</h1><p>{description}</p></div><div className="placeholder"><strong>Đang phát triển</strong><p>Trang này mới là khung giao diện, chưa kết nối API nghiệp vụ.</p></div></section>;
}
