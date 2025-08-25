const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <div className="footer">
      <p>&copy; {currentYear} CEG United LLC. All Rights Reserved.</p>
    </div>
  );
};

export default Footer;
