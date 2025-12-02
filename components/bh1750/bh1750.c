#include "bh1750.h"
#include "driver/i2c.h"
#include "esp_log.h"

#define I2C_MASTER_SCL_IO 22
#define I2C_MASTER_SDA_IO 21
#define I2C_MASTER_NUM I2C_NUM_0
#define I2C_MASTER_FREQ_HZ 100000
#define I2C_MASTER_TX_BUF_DISABLE 0
#define I2C_MASTER_RX_BUF_DISABLE 0

#define BH1750_ADDR 0x23
#define BH1750_POWER_ON 0x01
#define BH1750_CONT_H_RES_MODE 0x10

static const char *TAG = "BH1750";

esp_err_t bh1750_init(void)
{
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ,
    };
    ESP_ERROR_CHECK(i2c_param_config(I2C_MASTER_NUM, &conf));
    ESP_ERROR_CHECK(i2c_driver_install(I2C_MASTER_NUM, conf.mode, 0, 0, 0));

    uint8_t cmd = BH1750_POWER_ON;
    ESP_ERROR_CHECK(i2c_master_write_to_device(I2C_MASTER_NUM, BH1750_ADDR, &cmd, 1, 1000 / portTICK_PERIOD_MS));

    cmd = BH1750_CONT_H_RES_MODE;
    return i2c_master_write_to_device(I2C_MASTER_NUM, BH1750_ADDR, &cmd, 1, 1000 / portTICK_PERIOD_MS);
}

float bh1750_read_light(void)
{
    uint8_t data[2];
    esp_err_t ret = i2c_master_read_from_device(I2C_MASTER_NUM, BH1750_ADDR, data, 2, 1000 / portTICK_PERIOD_MS);
    if (ret != ESP_OK)
    {
        ESP_LOGE(TAG, "Failed to read");
        return -1;
    }

    uint16_t raw = (data[0] << 8) | data[1];
    return raw / 1.2;
}
