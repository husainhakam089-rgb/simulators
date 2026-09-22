package android.print;

import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import java.io.File;

/**
 * يكتب مخرجات PrintDocumentAdapter في ملف PDF بدل إرسالها للطابعة مباشرة.
 * الصنف داخل حزمة android.print لأن ردود PrintDocumentAdapter غير قابلة للوراثة من خارجها.
 */
public class PdfPrint {

    private static final String TAG = "PdfPrint";
    private final PrintAttributes printAttributes;

    public interface CallbackPrint {
        void onWriteFinished(File file);
        void onError(String message);
    }

    public PdfPrint(PrintAttributes printAttributes) {
        this.printAttributes = printAttributes;
    }

    public void print(final PrintDocumentAdapter adapter, final File outputFile, final CallbackPrint callback) {
        adapter.onLayout(null, printAttributes, new CancellationSignal(), new PrintDocumentAdapter.LayoutResultCallback() {
            @Override
            public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                final ParcelFileDescriptor descriptor = openDescriptor(outputFile);
                if (descriptor == null) {
                    callback.onError("تعذّر إنشاء ملف PDF");
                    return;
                }
                adapter.onWrite(new PageRange[]{PageRange.ALL_PAGES}, descriptor, new CancellationSignal(),
                        new PrintDocumentAdapter.WriteResultCallback() {
                            @Override
                            public void onWriteFinished(PageRange[] pages) {
                                super.onWriteFinished(pages);
                                closeQuietly(descriptor);
                                if (pages == null || pages.length == 0) {
                                    callback.onError("لم تُكتب أي صفحة");
                                } else {
                                    callback.onWriteFinished(outputFile);
                                }
                            }

                            @Override
                            public void onWriteFailed(CharSequence error) {
                                super.onWriteFailed(error);
                                closeQuietly(descriptor);
                                callback.onError(error == null ? "فشل حفظ الملف" : error.toString());
                            }
                        });
            }

            @Override
            public void onLayoutFailed(CharSequence error) {
                super.onLayoutFailed(error);
                callback.onError(error == null ? "فشل تهيئة الصفحة" : error.toString());
            }
        }, new Bundle());
    }

    private ParcelFileDescriptor openDescriptor(File file) {
        try {
            File parent = file.getParentFile();
            if (parent != null && !parent.exists()) parent.mkdirs();
            if (file.exists()) file.delete();
            file.createNewFile();
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_WRITE);
        } catch (Exception e) {
            Log.e(TAG, "openDescriptor", e);
            return null;
        }
    }

    private void closeQuietly(ParcelFileDescriptor descriptor) {
        try { descriptor.close(); } catch (Exception ignored) { }
    }
}
