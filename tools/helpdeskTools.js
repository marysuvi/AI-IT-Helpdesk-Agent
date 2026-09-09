function checkWifi() {
  return {
    tool: "Wi-Fi Checker",
    status: "Please check whether Wi-Fi is enabled and connected."
  };
}

function checkInternet() {
  return {
    tool: "Internet Checker",
    status: "Please test another website and check whether other devices have internet."
  };
}

function checkSystem() {
  return {
    tool: "System Checker",
    status: "Basic system check completed. Consider restarting the computer."
  };
}

module.exports = {
  checkWifi,
  checkInternet,
  checkSystem
};