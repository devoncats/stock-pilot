-- CreateTable
CREATE TABLE "demand_history" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "week" DATE NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "demand_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demand_history_product_id_week_key" ON "demand_history"("product_id", "week");

-- AddForeignKey
ALTER TABLE "demand_history" ADD CONSTRAINT "demand_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
