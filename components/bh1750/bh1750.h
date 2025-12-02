#pragma once

#include "esp_err.h"

esp_err_t bh1750_init(void);
float bh1750_read_light(void);
