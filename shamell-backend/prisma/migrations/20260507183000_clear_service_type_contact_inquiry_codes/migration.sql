-- Los tipos de servicio ya no enlazan códigos del formulario; solo nombre/categoría.
UPDATE "service_types" SET "contactInquiryCode" = NULL WHERE "contactInquiryCode" IS NOT NULL;
