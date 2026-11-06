from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

driver = webdriver.Chrome()
driver.maximize_window()

wait = WebDriverWait(driver, 10)


driver.get("https://the-internet.herokuapp.com/login")

time.sleep(2)


username = wait.until(EC.presence_of_element_located((By.ID, "username")))
driver.execute_script("arguments[0].style.border='3px solid red'", username)
time.sleep(1)
username.send_keys("tomsmith")


password = driver.find_element(By.ID, "password")
driver.execute_script("arguments[0].style.border='3px solid blue'", password)
time.sleep(1)
password.send_keys("SuperSecretPassword!")


login_btn = driver.find_element(By.CLASS_NAME, "radius")
driver.execute_script("arguments[0].style.border='3px solid green'", login_btn)
time.sleep(1)
login_btn.click()


message = wait.until(EC.presence_of_element_located((By.ID, "flash")))
driver.execute_script("arguments[0].style.border='4px solid yellow'", message)

print("Login Result:", message.text)

time.sleep(3)


logout = driver.find_element(By.LINK_TEXT, "Logout")
logout.click()

time.sleep(5)


driver.quit()