idf_component_register(
    SRCS "station_example_main.c"
    INCLUDE_DIRS "."
    REQUIRES bh1750 esp_wifi esp_event  nvs_flash  esp_http_client 
)
