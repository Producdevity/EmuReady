-- CreateTable
CREATE TABLE "_EmulatorToSystem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EmulatorToSystem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EmulatorToSystem_B_index" ON "_EmulatorToSystem"("B");

-- AddForeignKey
ALTER TABLE "_EmulatorToSystem" ADD CONSTRAINT "_EmulatorToSystem_A_fkey" FOREIGN KEY ("A") REFERENCES "Emulator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmulatorToSystem" ADD CONSTRAINT "_EmulatorToSystem_B_fkey" FOREIGN KEY ("B") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;
