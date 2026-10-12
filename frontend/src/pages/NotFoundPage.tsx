import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Coffee, Compass } from 'lucide-react';
import { useAuth } from '../store/auth';
import { Button } from '../components/ui/primitives';
import { landingPathFor } from '../components/layout/nav';

export function NotFoundPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const home = user ? landingPathFor(user.role) : '/login';

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 py-16">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sand text-caramel">
          <Coffee size={30} />
        </div>
        <p className="eyebrow mt-6">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold text-roast">This table took a wrong turn.</h1>
        <p className="mt-3 text-sm text-muted">
          We couldn&apos;t find that page. It may have moved, or the link might be out of date.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Link to={home} className="btn-secondary">
            <Compass size={16} aria-hidden /> Take me home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
