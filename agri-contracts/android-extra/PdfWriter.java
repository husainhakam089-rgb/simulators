package android.print;

import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;

import java.io.File;

/**
 * كتابة مستند PrintDocumentAdapter إلى ملف PDF.
 *
 * هذا الصنف داخل حزمة android.print عمداً: بانيا LayoutResultCallback
 * وWriteResultCallback محدودان بالحزمة، فلا يمكن اشتقاقهما من خارجها.
 *
 * والسبب في استعماله بدل الرسم اليدوي على Canvas: الـ WebView لا يرسم إلا
 * ما هو ظاهر منه، فالرسم اليدوي لصفحة خارج الشاشة يخرج ورقة بيضاء. أما هذا
 * المسار فهو نفسه الذي يستعمله أندرويد في «الحفظ كـ PDF»، فيخرج الملف
 * مطابقاً تماماً لما يخرج من زر الطباعة.
 */
public final class PdfWriter {

    public interface Done {
        void onDone(boolean ok, String error);
    }

    private PdfWriter() {
    }

    /** مقاس A4 بلا هوامش — الهوامش مضبوطة داخل قالب الطباعة نفسه. */
    public static PrintAttributes a4() {
        return new PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                .setResolution(new PrintAttributes.Resolution("pdf", "pdf", 300, 300))
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .build();
    }

    /** يُستدعى على خيط الواجهة؛ ويُبلّغ done على الخيط نفسه. */
    public static void write(final PrintDocumentAdapter adapter, final File out, final Done done) {
        final PrintAttributes attributes = a4();
        adapter.onLayout(null, attributes, new CancellationSignal(),
                new PrintDocumentAdapter.LayoutResultCallback() {
                    @Override
                    public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                        writePages(adapter, out, done);
                    }

                    @Override
                    public void onLayoutFailed(CharSequence error) {
                        done.onDone(false, "تعذّر تخطيط الصفحات: " + error);
                    }

                    @Override
                    public void onLayoutCancelled() {
                        done.onDone(false, "أُلغي تخطيط الصفحات");
                    }
                }, new Bundle());
    }

    private static void writePages(PrintDocumentAdapter adapter, File out, final Done done) {
        final ParcelFileDescriptor descriptor;
        try {
            descriptor = ParcelFileDescriptor.open(out,
                    ParcelFileDescriptor.MODE_CREATE
                            | ParcelFileDescriptor.MODE_TRUNCATE
                            | ParcelFileDescriptor.MODE_READ_WRITE);
        } catch (Exception e) {
            done.onDone(false, "تعذّر إنشاء ملف PDF: " + e.getMessage());
            return;
        }

        adapter.onWrite(new PageRange[]{PageRange.ALL_PAGES}, descriptor, new CancellationSignal(),
                new PrintDocumentAdapter.WriteResultCallback() {
                    @Override
                    public void onWriteFinished(PageRange[] pages) {
                        close(descriptor);
                        done.onDone(true, null);
                    }

                    @Override
                    public void onWriteFailed(CharSequence error) {
                        close(descriptor);
                        done.onDone(false, "تعذّرت كتابة PDF: " + error);
                    }

                    @Override
                    public void onWriteCancelled() {
                        close(descriptor);
                        done.onDone(false, "أُلغيت كتابة PDF");
                    }
                });
    }

    private static void close(ParcelFileDescriptor descriptor) {
        try {
            descriptor.close();
        } catch (Exception ignored) {
            // الملف مكتوب أصلاً؛ فشل الإغلاق لا يُبطله
        }
    }
}
